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

    _createOpenSearchResultSync(operation, rpcMessage) {
        const sessionState = rpcMessage.result.sessionState;
        // If not ready, just send the progress up;
        if (sessionState.status !== SESSION_STATUS.READY) {
            return {
                status: sessionState.status,
                progress: sessionState.progress
            };
        } else {
            // The status is 'ready', so the data is available in Redis.
            const conditions = operation.data;
            return {
                status: SESSION_STATUS.READY,
                progress: 100,
                redisDb: {
                    host: sessionState.redisDb.url,
                    number: sessionState.redisDb.number,
                    offset: conditions.offset,
                    total: conditions.total
                }
            };
        }
    }

    _createOperationResult(operation, rpcError, rpcMessage, callback) {
        const event = operation.method;
        const events = this.registeredEvents();

        let result = null;

        switch (event) {
            case events.openSearchSession:
                result = this._createOpenSearchResultSync(operation, rpcMessage);
                break;

            default:
                console.error('Unexpected result came from the application server, send as is.');
                result = rpcMessage.result;
                break;
        }

        const operationResult = {
            operation,
            error: rpcError,
            result
        };

        callback(null, operationResult);
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
}

module.exports = ApplicationServerReplyService;