'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('../../ServiceBase');
const EventProxy = require('../../../utils/EventProxy');
const ErrorUtils = require('../../../utils/ErrorUtils');
const OperationBase = require('../../operations/OperationBase');
const RESULT_TYPES = require('./AppServerResultTypes');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

/**
 * @typedef {Object} AppServerResult
 * @property {string}operationId
 * @property {string}operationType
 * @property {string[]}sessionIds
 * @property {boolean}isOperationCompleted
 * @property {(Object|undefined)}result
 * @property {string}resultType 'error' or 'success'
 * @property {(AppServerErrorResult|undefined)}error
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

    /**
     * Here RPC results are distributed by the actual handlers.
     * Handlers are expected to produce {AppServerOperationResult} 
     * in both error and success results.
     * @param rpcMessage Message to process.
     * @param callback
     */
    onRpcReplyReceived(rpcMessage, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.findInAllSessions(rpcMessage.id, callback);
            },
            (operation, callback) => {
                this._processOperationResult(operation, rpcMessage, (error, operationResult) => {
                    callback(error, operationResult);
                });
            },
            (operationResult, callback) => this._findSessionIdsForOperation(
                operationResult.operation,
                (error, sessionIds) => callback(error, operationResult, sessionIds)
            ),
            (operationResult, sessionIds, callback) => {
                this._completeOperationIfNeeded(
                    operationResult,
                    (error) => callback(error, operationResult, sessionIds)
                );
            },
            (operationResult, sessionIds, callback) => {
               this._createClientOperationResult(operationResult, sessionIds, callback);
            },
            (operationResult, clientOperationResult, callback) => {
                // Store client message in the operation for active uploads.
                const operation = operationResult.operation;
                if (operation.getType() == OperationBase.operationTypes().UPLOAD
                    && !clientOperationResult.isOperationCompleted) {
                    operation.setLastAppServerMessage(clientOperationResult);
                }
                callback(null, operationResult, clientOperationResult);
            },
            (operationResult, clientOperationResult, callback) => {
                this._emitEvent(operationResult.eventName, clientOperationResult, callback);
            }
        ], (error) => {
            callback(error);
        });
    }

    processLoadNextPageResult(operationResult, callback) {
        async.waterfall([
            (callback) => {
                this._findSessionIdsForOperation(operationResult.operation, callback);
            },
            (sessionIds, callback) => {
                this._completeOperationIfNeeded(operationResult, (error) => callback(error, sessionIds));
            },
            (sessionIds, callback) => {
                this._createClientOperationResult(operationResult, sessionIds, callback);
            },
            (operationResult, clientOperationResult, callback) => {
                this._emitEvent(operationResult.eventName, clientOperationResult, callback)
            }
        ], (error) => {
            callback(error);
        });
    }

    /**
     * @callback ClientOperationResultCallback
     * @param {Error}error
     * @param {AppServerOperationResult}operationResult
     * @param {AppServerResult}appServerResult
     * */

    /**
     * @param {AppServerOperationResult}operationResult
     * @param {string[]}sessionIds
     * @param {ClientOperationResultCallback}callback
     * */
    _createClientOperationResult(operationResult, sessionIds, callback) {
        const operation = operationResult.operation;
        /**
         * @type AppServerResult
         * */
        const eventData = {
            operationId: operation.getId(),
            sessionIds,
            operationType: operation.getType(),
            isOperationCompleted: operationResult.shouldCompleteOperation,
            resultType: operationResult.resultType,
            result: operationResult.result,
            error: operationResult.error
        };
        callback(null, operationResult, eventData);
    }

    _emitEvent(eventName, clientOperationResult, callback) {
        this.eventEmitter.emit(eventName, clientOperationResult);
        callback(null);
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * @param {OperationBase}operation
     * @param rpcMessage
     * @param {function(Error, AppServerOperationResult)}callback
     * @private
     */
    _processOperationResult(operation, rpcMessage, callback) {
        const method = operation.getMethod();

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
     *
     * @param {AppServerOperationResult}operationResult
     * @param {function(Error, AppServerOperationResult)}callback
     * */
    _completeOperationIfNeeded(operationResult, callback) {
        const operations = this.services.operations;
        const operation = operationResult.operation;
        if (operationResult.shouldCompleteOperation) {
            operations.remove(
                operation.sessionId,
                operation.getId(),
                (error) => callback(error, operationResult)
            );
        } else {
            callback(null, operationResult);
        }
    }
}

module.exports = ApplicationServerReplyService;