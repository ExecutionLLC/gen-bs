'use strict';

const async = require('async');
const EventEmitter = require('events').EventEmitter;

const ServiceBase = require('./ServiceBase');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

class ApplicationServerReplyService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.eventEmitter = new EventEmitter();
    }

    registeredEvents() {
        return this.services.applicationServer.registeredEvents();
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.removeListener(eventName, callback);
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
                    // TODO: Pre-process message reply to either report progress or attach operation data to results.
                    callback(null, {
                        operation,
                        result: rpcMessage.result,
                        error: rpcError
                    });
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