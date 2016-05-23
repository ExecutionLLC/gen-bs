'use strict';

const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const AppServerUploadUtils = require('../../../utils/AppServerUploadUtils');

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
        if (!message || !message.result || !message.result.status) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                eventName: EVENTS.onOperationResultReceived,
                shouldCompleteOperation: true
            });
        } else {
            const result = message.result;
            const status = result.status;
            const progress = result.progress;

            // If not ready, just send the progress up
            if (status !== SESSION_STATUS.READY) {
                const message = {
                    status,
                    progress,
                    shouldCompleteOperation: false,
                    eventName: EVENTS.onOperationResultReceived
                };
                operation.setLastAppServerMessage(message);
                callback(null, message);
            } else {
                // Sample is fully processed and the fields metadata is available.
                // Now we need to:
                // 1. Insert all the data into database.
                // 2. Send a message to the frontend to indicate the processing is fully completed.
                // 3. Close the operation.
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
                    callback(error, {
                        status,
                        progress,
                        sampleId: sampleVersionId,
                        eventName: EVENTS.onOperationResultReceived,
                        shouldCompleteOperation: true
                    });
                });
            }
        }
    }
}

module.exports = AppServerUploadService;
