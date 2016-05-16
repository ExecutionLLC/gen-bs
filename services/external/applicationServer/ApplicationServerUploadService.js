'use strict';

const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const AppServerUploadUtils = require('../../../utils/AppServerUploadUtils');

const METHODS = require('./ApplicationServerMethods');

class ApplicationServerUploadService extends ApplicationServerServiceBase {
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
}

module.exports = ApplicationServerUploadService;
