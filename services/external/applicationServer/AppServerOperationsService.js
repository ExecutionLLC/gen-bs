'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const SearchOperation = require('../../operations/SearchOperation');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const ReflectionUtils = require('../../../utils/ReflectionUtils');
const ErrorUtils = require('../../../utils/ErrorUtils');
const AppServerEvents = require('./AppServerEvents');

class AppServerOperationsService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    init() {
        this.services.applicationServerReply.on(AppServerEvents.onKeepAliveResultReceived, this._onKeepAliveResultReceived);
    }

    requestKeepOperationAlive(searchOperation, callback) {
        const method = METHODS.keepAlive;
        async.waterfall([
            (callback) => this._ensureSearchOperation(searchOperation, callback),
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => this.services.operations.addKeepAliveOperation(session, searchOperation,
                (error, operation) => callback(error, session, operation)),
            (session, operation, callback) => this._rpcSend(session, operation, method,
                {sessionId: this.createAppServerSessionId(searchOperation)}, callback)
        ], callback);
    }

    /**
     * Requests AS to close the specified operation.
     *
     * @param session session the operation is related to.
     * @param operationId Id of the operation to close.
     * @param callback (error, operationId)
     * */
    requestCloseSession(session, operationId, callback) {
        async.waterfall([
            (callback) => this.services.operations.find(session, operationId, callback),
            (operation, callback) => {
                this.logger.debug('Requesting close for ' + operation);
                const method = METHODS.closeSession;
                this._rpcSend(session, operation, method, null, callback);
            }
        ], callback);
    }

    requestOperationState(session, operationId, callback) {
        async.waterfall([
            (callback) => this.services.operations.findInAllSessions(operationId, callback),
            (operation, callback) => this._rpcSend(session, operation, METHODS.checkSession, null, callback)
        ], callback);
    }

    processKeepAliveResult(session, operation, rpcMessage, callback) {
        if (this._isAsErrorMessage(rpcMessage)) {
            this._createErrorOperationResult(
                session,
                operation,
                EVENTS.onKeepAliveResultReceived,
                true,
                ErrorUtils.createAppServerInternalError(rpcMessage),
                callback
            );
        } else {
            const isAlive = rpcMessage.result;
            this._silentlyCloseSearchOperationIfNeeded(session, operation, isAlive, () => {
                this._createOperationResult(session, operation, session.id,
                    session.userId, EVENTS.onKeepAliveResultReceived, true,
                    null, null, callback);
            });
        }
    }

    _onKeepAliveResultReceived() {
        // Currently, there is no other handler for the result,
        // so this is done to avoid error message in logs.
    }

    _silentlyCloseSearchOperationIfNeeded(session, operation, isAlive, callback) {
        if (isAlive) {
            callback(null);
            return;
        }
        const operationIdToCheck = operation.getOperationIdToCheck();
        async.waterfall([
            (callback) => this.services.operations.remove(
                session,
                operationIdToCheck,
                callback
            )
        ], (error) => {
            if (error) {
                this.logger.error('Error while closing dead search operation: ' + error);
            } else {
                this.logger.info(`Search operation ${operationIdToCheck} is removed due to the absence on AS`);
            }
            callback(null);
        });
    }

    _ensureSearchOperation(operation, callback) {
        if (ReflectionUtils.isSubclassOf(operation, SearchOperation)) {
            callback(null);
        } else {
            callback(new Error(`Expected search operation, found: ${operation}`));
        }
    }
}

module.exports = AppServerOperationsService;
