'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const ErrorUtils = require('../../../utils/ErrorUtils');

class AppServerOperationsService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    requestKeepOperationAlive(sessionId, searchOperationId, callback) {
        const method = METHODS.keepAlive;
        async.waterfall([
            (callback) => this.services.operations.find(sessionId, searchOperationId, callback),
            (searchOperation, callback) => this._ensureSearchOperation(searchOperation, callback),
            (searchOperation, callback) => this.services.sessions.findSystemSessionId(
                (error, sessionId) => callback(error, sessionId, searchOperation)
            ),
            (sessionId, searchOperation, callback) => this.services.operations.addKeepAliveOperation(
                sessionId, searchOperation, callback
            ),
            (operation, callback) => this._rpcSend(operation, method, {sessionId: searchOperationId}, callback)
        ], callback);
    }

    /**
     * Requests AS to close the specified operation.
     *
     * @param sessionId Id of the session the operation is related to.
     * @param operationId Id of the operation to close.
     * @param callback (error, operationId)
     * */
    requestCloseSession(sessionId, operationId, callback) {
        async.waterfall([
            (callback) => this.services.operations.find(sessionId, operationId, callback),
            (operation, callback) => {
                this.logger.debug('Requesting close for ' + operation);
                const method = METHODS.closeSession;
                this._rpcSend(operation, method, null, callback);
            }
        ], callback);
    }

    requestOperationState(operationId, callback) {
        async.waterfall([
            (callback) => this.services.operations.findInAllSessions(operationId, callback),
            (operation, callback) => this._rpcSend(operation, METHODS.checkSession, null, callback)
        ], callback);
    }

    processKeepAliveResult(operation, rpcMessage, callback) {
        if (this._isAsErrorMessage(rpcMessage)) {
            this._createErrorOperationResult(
                operation,
                EVENTS.onKeepAliveResultReceived,
                true,
                ErrorUtils.createAppServerInternalError(rpcMessage),
                callback
            );
        } else {
            const isAlive = rpcMessage.result;
            this._silentlyCloseSearchOperationIfNeeded(isAlive, operation, () => {
                /**
                 * @type AppServerOperationResult
                 * */
                const operationResult = {
                    eventName: EVENTS.onKeepAliveResultReceived,
                    shouldCompleteOperation: true,
                    operation,
                    result: null
                };
                callback(null, operationResult);
            });
        }
    }
    
    _silentlyCloseSearchOperationIfNeeded(isAlive, operation, callback) {
        if (isAlive) {
            callback(null);
            return;
        }
        const operationIdToCheck = operation.getOperationIdToCheck();
        async.waterfall([
            // The keep-alive operation belongs to system session.
            // So we need to find the operation id in all sessions.
            (callback) => this.services.operations.findInAllSessions(operationIdToCheck, callback),
            (operation, callback) => this.services.operations.remove(operation.getSessionId(), operation.getId(), callback)
        ], (error) => {
            if (error) {
                this.logger.error('Error while closing dead search operation: ' + error);
            }
            callback(null);
        });
    }

    _ensureSearchOperation(operation, callback) {
        const operationTypes = this.services.operations.operationTypes();
        if (operation.getType() === operationTypes.SEARCH) {
            callback(null, operation);
        } else {
            callback(new Error(`Expected search operation, found: ${operation.getType()}`));
        }
    }
}

module.exports = AppServerOperationsService;
