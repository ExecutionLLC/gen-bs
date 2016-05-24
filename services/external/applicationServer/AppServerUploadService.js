'use strict';

const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const AppServerUploadUtils = require('../../../utils/AppServerUploadUtils');
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
                const config = this.services.config;
                const url = AppServerUploadUtils.createUploadUrl(
                    config.applicationServer.host,
                    config.applicationServer.port,
                    sampleId,
                    operation.getId()
                );
                AppServerUploadUtils.uploadFile(url, sampleLocalPath, (error) => callback(error, operation.getId()));
            }
        ], callback);
    }

    requestSampleProcessing(sessionId, operationId, callback) {
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (systemSessionId, callback) => this.services.operations.find(systemSessionId, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                this._rpcSend(operationId, method, null, callback);
            }
        ], callback);
    }

    processUploadResult(operation, message, callback) {
        this.logger.info('Processing upload result for operation ' + operation.getId());
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                operation, 
                EVENTS.onOperationResultReceived, 
                true,
                ErrorUtils.createAppServerInternalError(message),
                callback
            );
        } else {
            const result = message.result;
            /**@type {string}*/
            const status = (result || {}).status;
            // If not ready, just send the progress up
            if (status !== SESSION_STATUS.READY) {
                this._createProgressMessage(operation, message, callback);
            } else {
                this._createUploadResult(operation, message, callback);
            }
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
    
    _createUploadResult(operation, message, callback) {
        // Sample is fully processed and the fields metadata is available.
        // Now we need to:
        // 1. Insert all the data into database.
        // 2. Send a message to the frontend to indicate the processing is fully completed.
        // 3. Close the operation.
        const result = message.result;
        const progress = result.progress;
        const status = result.status;
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
                this._createErrorOperationResult(
                    operation, 
                    EVENTS.onOperationResultReceived, 
                    true, 
                    ErrorUtils.createInternalError(error), 
                    callback
                );
                return;
            }

            /**
             * @type AppServerOperationResult
             * */
            const operationResult = {
                operation,
                eventName: EVENTS.onOperationResultReceived,
                shouldCompleteOperation: true,
                resultType: error ? RESULT_TYPES.ERROR : RESULT_TYPES.SUCCESS,
                result: {
                    status,
                    progress,
                    sampleId: sampleVersionId
                }
            };
            callback(null, operationResult);
        });
    }
}

module.exports = AppServerUploadService;
