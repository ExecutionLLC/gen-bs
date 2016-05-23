'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('../../ServiceBase');
const EventProxy = require('../../../utils/EventProxy');
const METHODS = require('./AppServerMethods');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

const EVENTS = {
    onKeepAliveResultReceived: 'onKeepAliveResultReceived',
    onOperationResultReceived: 'onOperationResultReceived',
    onSourcesListReceived: 'onSourcesListReceived',
    onSourceMetadataReceived: 'onSourceMetadataReceived'
};

/**
 * @typedef {Object} AppServerResult
 * @property {string}operationId
 * @property {boolean}isOperationCompleted
 * @property {string}operationType
 * @property {string}eventName
 * @property {Object}result
 * @property {string}resultType 'error' or 'success'
 * @property {Object}error
 * */

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

    _ensureMessageIsSuccessful(message, callback) {
        if (!message.id) {
            callback(new Error('Operation id is not defined.'));
        } else if (!message.error) {
            callback(null);
        } else {
            callback(message.error);
        }
    }

    /**
     * Here RPC results are distributed by the actual handlers.
     * Errors should also be handled on this level.
     * @param rpcMessage Message to process.
     * @param callback
     */
    onRpcReplyReceived(rpcMessage, callback) {
        async.waterfall([
            (callback) => this._ensureMessageIsSuccessful(rpcMessage, callback),
            (callback) => {
                this.services.operations.findInAllSessions(rpcMessage.id, callback);
            },
            (operation, callback) => {
                this._processOperationResult(operation, rpcMessage, (error, operationResult) => {
                    callback(error, operation, operationResult);
                });
            },
            (operation, operationResult, callback) => this._findSessionIdsForOperation(
                operation,
                (error, sessionIds) => callback(error, operation, operationResult, sessionIds)
            ),
            (operation, operationResult, sessionIds, callback) => {
                // Determine if we should complete the operation, and complete it.
                const shouldCompleteOperation = operationResult && operationResult.shouldCompleteOperation;
                this._completeOperationIfNeeded(
                    operation,
                    shouldCompleteOperation,
                    (error) => callback(error, operation, operationResult, sessionIds)
                );
            }
        ], (error, operation, operationResult, sessionIds) => {
            this._createOperationResult(error, operation, operationResult, sessionIds, callback);
        });
    }

    _createOperationResult(error, operation, operationResult, sessionIds, callback) {
        if (!operation) {
            this.logger.error('No operation is found. Error: ' + error);
            return;
        }

        if (operationResult) {
            // Fire only progress events here, for which operationResult != null.
            // Redis has it's own event to indicate the data retrieval finish,
            // and operationResult == null in this case.
            const eventData = {
                operationId: operation.getId(),
                sessionIds,
                result: operationResult
            };
            this.eventEmitter.emit(operationResult.eventName, eventData);
            callback(error, operationResult);
        } else {
            callback(error, null);
        }
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * @param {OperationBase}operation
     * @param rpcMessage
     * @param {function(Error, AppServerResult)}callback
     * @private
     */
    _processOperationResult(operation, rpcMessage, callback) {
        const method = operation.getMethod();
        const rpcError = rpcMessage.error;

        if (rpcError) {
            // Errors in any types of the operations except the search operations should make them completed.
            const shouldCompleteOperation = operation.getType() !== this.services.operations.operationTypes().SEARCH;
            callback(null, {
                operationId: operation.getId(),
                error: rpcError,
                result: rpcMessage,
                eventName: EVENTS.onOperationResultReceived,
                shouldCompleteOperation
            });
            return;
        }

        switch (method) {
            case METHODS.openSearchSession:
                this.services.applicationServerSearch.processSearchResult(operation, rpcMessage, callback);
                break;

            case METHODS.uploadSample:
                this.services.applicationServerUpload.processUploadResult(operation, rpcMessage, callback);
                break;

            case METHODS.getSourcesList:
                this.services.applicationServerSources.processGetSourcesListResult(operation, rpcMessage, callback);
                break;

            case METHODS.getSourceMetadata:
                this.services.applicationServerSources.processGetSourceMetadataResult(operation, rpcMessage, callback);
                break;

            case METHODS.keepAlive:
                this.services.applicationServerOperations.processKeepAliveResult(operation, rpcMessage, callback);
                break;

            default:
                this.logger.error('Unexpected result came from the application server, send as is.');
                callback(null, rpcMessage.result);
                break;
        }
    }

    _findSessionIdsForOperation(operation, callback) {
        const operationTypes = this.services.operations.operationTypes();
        if (operation.getType() !== operationTypes.UPLOAD) {
            callback(null, [operation.getSessionId()]);
        } else {
            // Upload operations belong to the system session and contain user id.
            // Here we need to find all active sessions for the specified user.
            const userId = operation.getUserId();
            this.services.sessions.findAllByUserId(userId, callback);
        }
    }

    /**
     * Deletes associated information for completed operations.
     * */
    _completeOperationIfNeeded(operation, shouldComplete, callback) {
        const operations = this.services.operations;
        if (shouldComplete) {
            operations.remove(operation.sessionId, operation.getId(), callback);
        } else {
            callback(null, operation);
        }
    }
}

module.exports = ApplicationServerReplyService;