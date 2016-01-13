'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

const EVENTS = {
    onOperationResultReceived: 'onOperationResultReceived',
    onSourcesListReceived: 'onSourcesListReceived',
    onSourceMetadataReceived: 'onSourceMetadataReceived'
};

class ApplicationServerReplyService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.eventEmitter = new EventProxy(EVENTS);
    }

    registeredEvents() {
        return EVENTS;
    }

    sessionStatuses() {
        return SESSION_STATUS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }

    onRpcReplyReceived(rpcError, rpcMessage, callback) {
        if (rpcError && !rpcMessage) {
            console.error('RPC request error! %s', rpcError);
            console.log('The RPC event will be ignored, as there is no message received, only error.');
        } else {
            async.waterfall([
                (callback) => {
                    this._findMessageOperation(rpcMessage, callback);
                },
                (operation, callback) => {
                    this._completeOperationIfNeeded(operation, callback);
                },
                (operation, callback) => {
                    this._processOperationResult(operation, rpcError, rpcMessage, (error, operationResult) => {
                        callback(error, {
                            operation,
                            operationResult
                        });
                    });
                }
            ], (error, resultWithOperation) => {
                if (!resultWithOperation || !resultWithOperation.operation) {
                    console.error('No operation is found. Error: ' + error);
                } else {
                    const operation = resultWithOperation.operation;
                    const result = resultWithOperation.operationResult;
                    const eventData = {
                        operationId: operation.id,
                        sessionId: operation.sessionId,
                        result
                    };
                    this.eventEmitter.emit(EVENTS.onOperationResultReceived, eventData);
                    callback(error, result);
                }
            });
        }
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * */
    _processOperationResult(operation, rpcError, rpcMessage, callback) {
        const event = operation.method;
        const events = this.services.applicationServer.registeredEvents();

        let result = null;

        if (rpcError) {
            callback(null, {
                operationId: operation.id,
                error: rpcError,
                result: rpcMessage
            });
            return;
        }

        // Each of the following methods is expected to set 'eventName' parameter,
        // which describes an event that should be raised with the result.
        switch (event) {
            case events.openSearchSession:
                this._processOpenSearchResult(operation, rpcMessage, callback);
                break;

            default:
                console.error('Unexpected result came from the application server, send as is.');
                callback(null, rpcMessage.result);
                break;
        }
    }

    /**
     * Parses RPC message for the 'open_session' method calls.
     * */
    _processOpenSearchResult(operation, message, callback) {
        if (!message || !message.result || !message.result.sessionState) {
            console.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message
            });
        } else {
            const sessionState = message.result.sessionState;
            const conditions = operation.data;

            const sampleId = conditions.sampleId;
            const userId = conditions.userId;
            const limit = conditions.limit;
            const offset = conditions.offset;

            // If not ready, just send the progress up
            if (sessionState.status !== SESSION_STATUS.READY) {
                callback(null, {
                    status: sessionState.status,
                    progress: sessionState.progress
                });
            } else {
                // Get data from Redis
                const redisAddress = this._parseRedisAddress(sessionState.redisDb.url);
                const redisParams = {
                    host: redisAddress.host,
                    port: redisAddress.port,
                    sampleId,
                    userId,
                    databaseNumber: sessionState.redisDb.number,
                    dataIndex: sessionState.sort.index,
                    offset,
                    limit
                };
                async.waterfall([
                    (callback) => {
                        this.services.redis.fetch(redisParams, callback);
                    }
                ], (error, result) => {
                    callback(error, {
                        sampleId,
                        offset,
                        limit,
                        data: result
                    });
                });
            }
        }
    }

    _findMessageOperation(rpcMessage, callback) {
        const operationId = rpcMessage.id;
        this.services.operations.findInAllSessions(operationId, callback);
    }

    /**
     * Deletes associated information for completed operations.
     * */
    _completeOperationIfNeeded(operation, callback) {
        // TODO: Here we should analyze the response and operation method
        // TODO: and decide should we remove the operation or not.
        // Currently just complete all non-search operations.
        const operations = this.services.operations;
        if (operation.type !== operations.operationTypes().SEARCH) {
            operations.remove(operation.sessionId, operation.id, callback);
        } else {
            callback(null, operation);
        }
    }

    _parseRedisAddress(hostAddress) {
        const addressParts = hostAddress.split(':');
        const host = addressParts[0];
        const port = addressParts[1];
        return {
            host,
            port
        };
    }
}

module.exports = ApplicationServerReplyService;
