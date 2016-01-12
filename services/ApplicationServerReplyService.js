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
                    this._createOperationResult(operation, rpcError, rpcMessage, callback);
                },
                (operationResult, callback) => {
                    const eventName = operationResult.operation.method;
                    const haveEventHandlers = this.eventEmitter.emit(eventName, operationResult);
                    if (!haveEventHandlers) {
                        console.error('No handler is registered for event ' + eventName);
                    }
                    callback(null);
                }
            ], (error, result) => {
                callback(error, result);
            });
        }
    }

    _createOperationResult(operation, rpcError, rpcMessage, callback) {
        const event = operation.method;
        const events = this.registeredEvents();

        let result = null;

        if (rpcError) {
            callback(null, {
                operation,
                error: rpcError,
                result: rpcMessage
            });
            return;
        }

        switch (event) {
            case events.openSearchSession:
                result = this._createOpenSearchResultSync(operation, rpcMessage, rpcError);
                break;

            default:
                console.error('Unexpected result came from the application server, send as is.');
                result = rpcMessage.result;
                break;
        }

        const operationResult = {
            operation,
            result
        };

        callback(null, operationResult);
    }

    _createOpenSearchResultSync(operation, message, error) {
        if (error) {
            return {
                error,
                message
            };
        }

        if (!message || !message.result || !message.result.sessionState) {
            console.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            return;
        }
        const sessionState = message.result.sessionState;
        // If not ready, just send the progress up
        if (sessionState.status !== SESSION_STATUS.READY) {
            return {
                status: sessionState.status,
                progress: sessionState.progress
            };
        } else {
            // The status is 'ready', so the data is available in Redis.
            const conditions = operation.data;
            const redisAddress = this._parseAddress(sessionState.redisDb.url);
            return {
                status: SESSION_STATUS.READY,
                progress: 100,
                redisDb: {
                    host: redisAddress.host,
                    port: redisAddress.port,
                    dataIndex: sessionState.sort.index,
                    databaseNumber: sessionState.redisDb.number
                },
                offset: conditions.offset,
                limit: conditions.limit
            };
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
