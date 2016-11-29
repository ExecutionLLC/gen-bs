'use strict';

const fs = require('fs');
const async = require('async');
const _ = require('lodash');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const ErrorUtils = require('../../../utils/ErrorUtils');

const METHODS = require('./AppServerMethods');
const {SAMPLE_UPLOAD_STATUS} = require('../../../utils/Enums');
const EVENTS = require('./AppServerEvents');
const SESSION_STATUS = {
    CONVERTING: 'converting',
    UPLOADING: 'uploading',
    READY: 'ready'
};

class AppServerUploadService extends ApplicationServerServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    uploadSample(session, sampleId, user, sampleLocalPath, sampleFileName, callback) {
        async.waterfall([
            (callback) => this.services.operations.addUploadOperation(METHODS.uploadSample, callback),
            (operation, callback) => {
                operation.setSampleId(sampleId);
                operation.setSampleFileName(sampleFileName);
                operation.setUserId(user.id);
                callback(null, operation);
            },
            (operation, callback) => {
                const {newSamplesBucket} = this.services.objectStorage.getStorageSettings();
                const fileStream = fs.createReadStream(sampleLocalPath);
                this.services.objectStorage.uploadObject(newSamplesBucket, sampleId, fileStream,
                    (error) => callback(null, error, operation)
                );
            },
            (error, operation, callback) => {
                if (error) {
                    // We didn't start the upload session on app server yet.
                    operation.setSendCloseToAppServer(false);

                    // But started it locally, so remove it.
                    async.waterfall([
                        (callback) => this.services.sessions.findSystemSession(callback),
                        (session, callback) => this.services.operations.remove(session, operation.getId(), callback)
                    ], () => callback(error));
                } else {
                    callback(null, operation.getId());
                }
            }
        ], callback);
    }

    toggleNextOperation(currentOperationId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => {
                const currentOperation = _.find(systemSession.operations, operation => {
                            return operation.getId() == currentOperationId;
                        }
                    ) || null;
                const currentUserId = !_.isNull(currentOperation) ? currentOperation.getUserId() : null;
                const activeOperationUsersIds = _.filter(systemSession.operations, operation => {
                    return operation.isActive && operation.getUserId() != currentUserId;
                }).map(operation => operation.getUserId());
                const orderedOperations = _.orderBy(systemSession.operations, ['timestamp'], ['asc']);
                const nextOperation = _.find(orderedOperations, operation => {
                    return !_.includes(activeOperationUsersIds, operation.getUserId()) && !operation.isActive;
                });
                if (nextOperation) {
                    nextOperation.isActive = true;
                    async.waterfall([
                        (callback) => this.services.sessions.findById(nextOperation.getSessionId(), callback),
                        (session, callback) => this.requestSampleProcessing(session, nextOperation.getId(), nextOperation.getSampleId(), null, (error) => callback(error))
                    ], callback)
                } else {
                    callback(null);
                }
            }
        ], callback);
    }

    requestSampleProcessing(session, operationId, sampleId, priority, callback) {
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => this.services.operations.find(systemSession, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                const {newSamplesBucket} = this.services.objectStorage.getStorageSettings();
                const params = {
                    sample: sampleId,
                    bucket: newSamplesBucket
                };
                this._rpcSend(session, operation, method, params, priority, callback);
            }
        ], callback);
    }

    requestUploadProcessing(session, operationId, sampleId, priority, callback) {
        const {userId} = session;
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => {
                const currentOperation = _.find(systemSession.operations, operation => {
                        return operation.getId() == operationId;
                    }
                );
                const userOperations = _.filter(systemSession.operations, operation => {
                    return operation.getUserId() == userId;
                });
                const activeUserOperation = _.filter(userOperations,operation =>{
                   return operation.isActive;
                });
                if (activeUserOperation.length == 0 ){
                    currentOperation.isActive = true;
                    this.requestSampleProcessing(session, operationId, sampleId, priority, callback);
                }else {
                    callback(null, operationId);
                }
            }
        ], callback);
    }

    processUploadResult(session, operation, message, callback) {
        this.logger.debug('Processing upload result for ' + operation);
        const result = message.result;
        /**@type {string}*/
        const status = (result || {}).status;
        async.waterfall([
            (callback) => this.services.users.find(operation.getUserId(), callback),
            (user, callback) => {
                if (this._isAsErrorMessage(message)) {
                    this._handleUploadError(user, session, operation, message, callback);
                } else if (status !== SESSION_STATUS.READY) {
                    this._handleUploadProgress(user, session, operation, message, callback);
                } else {
                    this._completeUpload(user, session, operation, message, callback);
                }
            }
        ], callback);
    }

    _handleUploadError(user, session, operation, message, callback) {
        const error = ErrorUtils.createAppServerInternalError(message);
        async.waterfall([
            (callback) => this.services.sampleUploadHistory.update(user, {
                id: operation.getId(),
                status: SAMPLE_UPLOAD_STATUS.ERROR,
                error
            }, (error) => callback(error)),
            (callback) => {
                const {newSamplesBucket} = this.services.objectStorage.getStorageSettings();
                const sampleId = operation.getSampleId();
                this.services.objectStorage.deleteObject(newSamplesBucket, sampleId,
                    (error, result) => callback(error)
                );
            },
            (callback) => this.toggleNextOperation(operation.getId(), callback),
            (callback) => this._createOperationResult(
                session,
                operation,
                null,
                operation.getUserId(),
                EVENTS.onOperationResultReceived,
                true,
                null,
                ErrorUtils.createAppServerInternalError(message),
                callback
            )
        ], callback);
    }

    _handleUploadProgress(user, session, operation, message, callback) {
        const {result: {status, progress}} = message;
        async.waterfall([
            (callback) => this.services.sampleUploadHistory.update(user, {
                id: operation.getId(),
                status: SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
                progress,
                error: null
            }, (error) => callback(error)),
            (callback) => this._createUploadProgressResult(user, session, operation, message, callback),
            (result, callback) => super._createOperationResult(
                session, operation, null, operation.getUserId(), EVENTS.onOperationResultReceived, false, result, null, callback
            )
        ], callback);
    }

    _createUploadProgressResult(user, session, operation, message, callback) {
        const {result: {status, progress, genotypes}} = message;
        if (genotypes) {
            const sampleGenotypes = _.isEmpty(genotypes) ? [null] : genotypes;
            const sampleId = operation.getSampleId();
            const sampleFileName = operation.getSampleFileName();
            async.waterfall([
                (callback) => this.services.samples.initMetadataForUploadedSample(
                    user, sampleId, sampleFileName, sampleGenotypes, callback
                ),
                (sampleVersionIds, callback) => this.services.samples.findMany(user, sampleVersionIds, callback),
                (samples, callback) => {
                    callback(null, {
                        status,
                        progress,
                        metadata: samples
                    });
                }
            ], callback);
        } else {
            callback(null, {
                status,
                progress
            });
        }
    }

    _completeUpload(user, session, operation, message, callback) {
        // Sample is fully processed and the fields metadata is available.
        // Now we need to:
        // 1. Insert all the data into database.
        // 2. Close the operation.
        // 3. Mark upload as completed in the database.
        const result = message.result;
        /**@type {string}*/
        const sampleId = operation.getSampleId();
        const sampleMetadata = result.metadata;
        // Usual fields metadata. Values of these fields are the same for all genotypes.
        const commonFieldsMetadata = sampleMetadata.columns;
        // Array of names of the genotypes found in the file.
        const genotypes = sampleMetadata.genotypes || [null];

        async.waterfall([
            (callback) => this.services.samples.createMetadataForUploadedSample(user, sampleId, commonFieldsMetadata, genotypes,
                (error, sampleVersionIds) => callback(error, sampleVersionIds)
            ),
            (sampleVersionIds, callback) => this.services.samples.findMany(user, sampleVersionIds, callback),
            (samplesMetadata, callback) => this.services.sampleUploadHistory.update(user, {
                id: operation.getId(),
                status: SAMPLE_UPLOAD_STATUS.READY,
                progress: 100,
                error: null
            }, (error) => callback(error, samplesMetadata))
        ], (error, samplesMetadata) => {
            async.waterfall([
                (callback) => this.toggleNextOperation(operation.getId(), callback),
                (callback) => {
                    if (error) {
                        this.logger.error(`Error inserting new sample into database: ${error}`);
                        this._createOperationResult(session, operation, null, operation.getUserId(),
                            EVENTS.onOperationResultReceived, true, null, ErrorUtils.createInternalError(error), callback);

                    } else {
                        // The upload operation is already completed on the app server.
                        operation.setSendCloseToAppServer(false);
                        this._createOperationResult(session, operation, null, operation.getUserId(), EVENTS.onOperationResultReceived, true, {
                            status: SESSION_STATUS.READY,
                            progress: 100,
                            metadata: samplesMetadata
                        }, null, callback);
                    }
                }
            ], callback);

        });
    }
}

module.exports = AppServerUploadService;
