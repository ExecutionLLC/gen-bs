'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');

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
        this.logger.info('Processing get sources list result for operation ' + operation.getId());
        if (!message || !message.result) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                eventName: EVENTS.onSourcesListReceived,
                result: message
            });
        } else {
            const sourcesList = _.map(message.result, (source) => {
                source.sourceName = source.sourceName.replace('.h5', '');
                return source;
            });
            callback(null, {
                eventName: EVENTS.onSourcesListReceived,
                sourcesList
            });
        }
    }

    processGetSourceMetadataResult(operation, message, callback) {
        this.logger.info('Processing get sources list result for operation ' + operation.getId());
        if (!message || !message.result) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                eventName: EVENTS.onSourceMetadataReceived
            });
        } else {
            const messageResult = message.result;
            if (messageResult.error) {
                callback(null, {
                    eventName: EVENTS.onSourceMetadataReceived,
                    error: messageResult.error
                });
            } else {
                const convertedSourcesMetadata = _.map(messageResult, sourceMetadata => {
                    return {
                        fieldsMetadata: sourceMetadata.columns,
                        reference: sourceMetadata.reference
                    };
                });
                callback(null, {
                    eventName: EVENTS.onSourceMetadataReceived,
                    sourcesMetadata: convertedSourcesMetadata
                });
            }
        }
    }
}

module.exports = AppServerSourcesService;
