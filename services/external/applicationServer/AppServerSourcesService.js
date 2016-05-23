'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const RESULT_TYPES = require('./AppServerResultTypes');

class AppServerSourcesService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    requestSourcesList(callback) {
        const method = METHODS.getSourcesList;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, null, callback)
        ], callback);
    }

    requestSourceMetadata(sourceNames, callback) {
        const method = METHODS.getSourceMetadata;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, _.map(sourceNames, (sourceName) => {
                return sourceName + '.h5'
            }), callback)
        ], callback);
    }

    processGetSourcesListResult(operation, message, callback) {
        const sourcesList = _.map(message.result, (source) => {
            source.sourceName = source.sourceName.replace('.h5', '');
            return source;
        });

        /**
         * @type AppServerOperationResult
         * */
        const operationResult = {
            eventName: EVENTS.onSourcesListReceived,
            operation,
            shouldCompleteOperation: true,
            resultType: RESULT_TYPES.SUCCESS,
            result: sourcesList,
            error: null
        };
        
        callback(null, operationResult);
    }

    processGetSourceMetadataResult(operation, message, callback) {
        this.logger.info('Processing get sources list result for operation ' + operation.getId());

        const messageResult = message.result;
        const convertedSourcesMetadata = _.map(messageResult, sourceMetadata => {
            return {
                fieldsMetadata: sourceMetadata.columns,
                reference: sourceMetadata.reference
            };
        });
        
        /**
         * @type AppServerOperationResult
         * */
        const operationResult = {
            eventName: EVENTS.onSourceMetadataReceived,
            operation,
            shouldCompleteOperation: true,
            resultType: RESULT_TYPES.SUCCESS,
            result: convertedSourcesMetadata,
            error: null
        };
        callback(null, operationResult);
    }
}

module.exports = AppServerSourcesService;
