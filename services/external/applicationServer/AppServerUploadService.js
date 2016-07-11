'use strict';

const fs = require('fs');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const ErrorUtils = require('../../../utils/ErrorUtils');

const RESULT_TYPES = require('./AppServerResultTypes');
const METHODS = require('./AppServerMethods');
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
    
    uploadSample(sessionId, sampleId, user, sampleLocalPath, sampleFileName, callback) {
        async.waterfall([
            (callback) => this.services.operations.addUploadOperation(METHODS.uploadSample, user.id, callback),
            (operation, callback) => {
                operation.setSampleId(sampleId);
                operation.setSampleFileName(sampleFileName);
                callback(null, operation);
            },
            (operation, callback) => {
                const {newSamplesBucket} = this.services.objectService.getStorageSettings();
                const fileStream = fs.createReadStream(sampleLocalPath);
                this.services.objectStorage.uploadObject(newSamplesBucket, sampleId, fileStream,
                    (error) => callback(error, operation.getId())
                );
            }
        ], callback);
    }

    requestSampleProcessing(sessionId, operationId, sampleId, callback) {
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (systemSessionId, callback) => this.services.operations.find(systemSessionId, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                const params = {
                    sampleId
                };
                this._rpcSend(operation, method, params, callback);
            }
        ], callback);
    }

    processUploadResult(operation, message, callback) {
        this.logger.debug('Processing upload result for ' + operation);
        const result = message.result;
        /**@type {string}*/
        const status = (result || {}).status;
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                operation, 
                EVENTS.onOperationResultReceived, 
                true,
                ErrorUtils.createAppServerInternalError(message),
                callback
            );
        } else if (status !== SESSION_STATUS.READY) {
            // If not ready, just send the progress up
            this._createProgressMessage(operation, message, callback);
        } else {
            this._completeUpload(operation, message, callback);
        }
    }
    
    _createProgressMessage(operation, message, callback) {
        const result = message.result;
        const status = result.status;
        const progress = result.progress;
        /**
         * @type AppServerOperationResult
         * */
        const operationResult = {
            operation,
            eventName: EVENTS.onOperationResultReceived,
            shouldCompleteOperation: false,
            resultType: RESULT_TYPES.SUCCESS,
            result: {
                status,
                progress
            }
        };
        
        callback(null, operationResult);
    }
    
    _completeUpload(operation, message, callback) {
        // Sample is fully processed and the fields metadata is available.
        // Now we need to:
        // 1. Insert all the data into database.
        // 2. Close the operation.
        // 3. Send a message to the other WS instances to indicate the processing is fully completed.
        const result = message.result;
        /**@type {string}*/
        const sampleId = operation.getSampleId();
        const sampleMetadata = result.metadata;
        const fieldsMetadata = sampleMetadata.columns;
        const sampleReference = sampleMetadata.reference;
        const sampleFileName = operation.getSampleFileName();
        const userId = operation.getUserId();

        async.waterfall([
            (callback) => this.services.users.find(userId, callback),
            (user, callback) => this.services.samples.createMetadataForUploadedSample(user, sampleId,
                sampleFileName, sampleReference, fieldsMetadata, callback)
        ], (error, sampleVersionId) => {
            if (error) {
                this.logger.error(`Error inserting new sample into database: ${error}`);
                this._createErrorOperationResult(
                    operation,
                    EVENTS.onSampleUploadCompleted,
                    true,
                    ErrorUtils.createInternalError(error),
                    callback
                );
            } else {
                // The upload operation is already completed on the app server.
                operation.setSendCloseToAppServer(false);
                this._createUploadSuccessfulResult(operation, sampleVersionId, callback);
            }
        });
    }

    _createUploadSuccessfulResult(operation, sampleVersionId, callback) {
        /**
         * @type AppServerOperationResult
         * */
        const operationResult = {
            operation,
            eventName: EVENTS.onOperationResultReceived,
            shouldCompleteOperation: true,
            resultType: RESULT_TYPES.SUCCESS,
            result: {
                status: SESSION_STATUS.READY,
                progress: 100,
                sampleId: sampleVersionId
            }
        };
        callback(null, operationResult);
    }
}

module.exports = AppServerUploadService;
