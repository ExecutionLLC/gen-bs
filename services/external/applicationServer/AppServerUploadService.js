'use strict';

const fs = require('fs');
const async = require('async');

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
            (callback) => super._createOperationResult(session, operation, null, operation.getUserId(),
                EVENTS.onOperationResultReceived, false, {status, progress}, null, callback)
        ], callback);
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
        const genotypes = sampleMetadata.genotypes;
        // Fields whose values are specific for the genotypes.
        const genotypesFieldsMetadata = sampleMetadata.genotypeColumns;
        const sampleReference = sampleMetadata.reference;
        const sampleFileName = operation.getSampleFileName();

        async.waterfall([
            (callback) => this.services.samples.createMetadataForUploadedSample(user, sampleId,
                sampleFileName, sampleReference, commonFieldsMetadata, genotypes, genotypesFieldsMetadata,
                (error, sampleVersionIds) => callback(error, sampleVersionIds)
            ),
            (sampleVersionIds, callback) => this.services.samples.findMany(user, sampleVersionIds, callback),
            (samplesMetadata, callback) => this.services.sampleUploadHistory.update(user, {
                id: operation.getId(),
                status: SAMPLE_UPLOAD_STATUS.READY,
                progress: 100,
                error: null
            }, (error) => callback(error))
        ], (error, samplesMetadata) => {
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
        });
    }
}

module.exports = AppServerUploadService;
