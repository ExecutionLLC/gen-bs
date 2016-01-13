'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

class ApplicationServerReplyService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.eventEmitter = new EventProxy();
    }

    registeredEvents() {
        return this.services.applicationServer.registeredEvents();
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
                    this._parseOperationResult(operation, rpcError, rpcMessage, (error, result) => {
                        result.operation = operation;
                        callback(error, result);
                    });
                }
            ], (error, result) => {
                const eventName = result.operation.method;
                const haveEventHandlers = this.eventEmitter.emit(eventName, result);
                if (!haveEventHandlers) {
                    console.error('No handler is registered for event ' + eventName);
                }
                callback(error, result);
            });
        }
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * */
    _parseOperationResult(operation, rpcError, rpcMessage, callback) {
        const event = operation.method;
        const events = this.registeredEvents();

        let result = null;

        if (rpcError) {
            callback(null, {
                operationId: operation.id,
                error: rpcError,
                result: rpcMessage
            });
            return;
        }

        switch (event) {
            case events.openSearchSession:
                this._parseOpenSearchResult(operation, rpcMessage, callback);
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
    _parseOpenSearchResult(operation, message, callback) {
        if (!message || !message.result || !message.result.sessionState) {
            console.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message
            });
        } else {
            const sessionState = message.result.sessionState;
            // If not ready, just send the progress up
            if (sessionState.status !== SESSION_STATUS.READY) {
                callback(null, {
                    status: sessionState.status,
                    progress: sessionState.progress
                });
            } else {
                // Get data from Redis
                const conditions = operation.data;
                const redisAddress = this._parseAddress(sessionState.redisDb.url);
                const redisParams = {
                    host: redisAddress.host,
                    port: redisAddress.port,
                    sampleId: conditions.sampleId,
                    userId: conditions.userId,
                    databaseNumber: sessionState.redisDb.number,
                    dataIndex: sessionState.sort.index,
                    offset: conditions.offset,
                    limit: conditions.limit
                };
                async.waterfall([
                    (callback) => {
                        this.services.redis.fetch(redisParams, callback);
                    }
                ], (error, result) => {
                    // TODO: Create result
                    callback(null, {
                        error,
                        result
                    })
                });
            }
        }
    }

    _findMessageOperation(rpcMessage, callback) {
        const operationId = rpcMessage.id;
        this.services.operations.findInAllSessions(operationId, callback);
    }

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

    _parseAddress(hostAddress) {
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
