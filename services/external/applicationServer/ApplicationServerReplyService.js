'use strict';

const async = require('async');
const _ = require('lodash');
const AsyncLock = require('async-lock');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const EventProxy = require('../../../utils/EventProxy');
const ErrorUtils = require('../../../utils/ErrorUtils');
const ReflectionUtils = require('../../../utils/ReflectionUtils');
const UploadOperation = require('../../operations/UploadOperation');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const OperationNotFoundError = require('../../../utils/errors/OperationNotFoundError');
const lock = new AsyncLock();

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

class ApplicationServerReplyService extends ApplicationServerServiceBase {
    constructor(services, models) {
        super(services, models);

        this.eventEmitter = new EventProxy(EVENTS);
    }

    registeredEvents() {
        return EVENTS;
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
     * @param sessionId
     * @param operationId
     * @param rpcMessage Message to process.
     * @param callback
     */
    onRpcReplyReceived(sessionId, operationId, rpcMessage, callback) {
        const {replyTo} = rpcMessage;
        lock.acquire(sessionId, (callback) => {
            async.waterfall([
                (callback) => this.services.sessions.findById(sessionId, callback),
                (session, callback) => this.services.operations.find(session, operationId,
                    (error, operation) => callback(error, session, operation)
                ),
                (session, operation, callback) => this._setASQueryNameIfAny(operation, rpcMessage,
                    (error) => callback(error, session, operation)
                ),
                (session, operation, callback) => this._processOperationResult(session, operation, rpcMessage, callback),
                (operationResult, callback) => {
                    // Store client message in the operation for active uploads.
                    const operation = operationResult.operation;
                    if (ReflectionUtils.isSubclassOf(operation, UploadOperation)
                        && !operationResult.shouldCompleteOperation) {
                        operation.setLastAppServerMessage(operationResult.result);
                    }
                    callback(null, operationResult);
                },
                (operationResult, callback) => this._completeOperationIfNeeded(operationResult, callback),
                (operationResult, callback) => this._emitEvent(operationResult.eventName,
                    operationResult, (error) => callback(error, operationResult)),
                // We are working with the session by ourselves, so need to explicitly save it here.
                (operationResult, callback) => this.services.sessions.saveSession(operationResult.session, callback)
            ], (error) => {
                if (error instanceof OperationNotFoundError && replyTo) {
                    this._sendRpcNotFoundOperation(operationId, rpcMessage, () => callback(error));
                } else {
                    callback(error);
                }
            });
        }, callback);

    }

    _sendRpcNotFoundOperation(operationId, rpcMessage, callback) {
        const {id, replyTo} = rpcMessage;
        const method = METHODS.closeSession;
        this._rpcProxySend(id, operationId, method, null, replyTo, null, (error) => callback(error));
    }

    _emitEvent(eventName, operationResult, callback) {
        this.eventEmitter.emit(eventName, operationResult);
        callback(null);
    }

    /**
     * @callback ClientOperationResultCallback
     * @param {Error}error
     * @param {AppServerOperationResult}operationResult
     * @param {AppServerResult}appServerResult
     * */

    /**
     * @callback OperationResultCallback
     * @param {Error}error
     * @param {AppServerOperationResult}[operationResult]
     * */

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * @param {ExpressSession}session
     * @param {OperationBase}operation
     * @param rpcMessage
     * @param {OperationResultCallback}callback
     * @private
     */
    _processOperationResult(session, operation, rpcMessage, callback) {
        const method = operation.getMethod();

        switch (method) {
            case METHODS.openSearchSession:
                this.services.applicationServerSearch.processSearchResult(session, operation, rpcMessage, callback);
                break;

            case METHODS.uploadSample:
                this.services.applicationServerUpload.processUploadResult(session, operation, rpcMessage, callback);
                break;

            case METHODS.getSourcesList:
                this.services.applicationServerSources.processGetSourcesListResult(session, operation, rpcMessage, callback);
                break;

            case METHODS.getSourceMetadata:
                this.services.applicationServerSources.processGetSourceMetadataResult(session, operation, rpcMessage, callback);
                break;

            case METHODS.keepAlive:
                this.services.applicationServerOperations.processKeepAliveResult(session, operation, rpcMessage, callback);
                break;

            default:
                callback(new Error('Ignoring unexpected result came from the application server.'));
                break;
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
        const {session, operation} = operationResult;
        if (operationResult.shouldCompleteOperation) {
            operations.remove(session,
                operation.getId(),
                (error) => callback(error, operationResult)
            );
        } else {
            callback(null, operationResult);
        }
    }

    _setASQueryNameIfAny(operation, rpcMessage, callback) {
        if (rpcMessage.replyTo) {
            operation.setASQueryName(rpcMessage.replyTo);
        }
        callback(null, operation);
    }
}

module.exports = ApplicationServerReplyService;