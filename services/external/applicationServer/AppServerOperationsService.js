'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const {SearchOperation} = require('../../operations/Operations');
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

    requestKeepOperationAlive(session, searchOperation, callback) {
        const method = METHODS.keepAlive;
        async.waterfall([
            (callback) => this._ensureSearchOperation(searchOperation, callback),
            (callback) => this.services.operations.addKeepAliveOperation(session, searchOperation,
                (error, operation) => callback(error, operation)),
            (operation, callback) => this._rpcSend(operation, method,
                {sessionId: this.createAppServerSessionId(searchOperation)}, null, callback)
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
                this._rpcSend(operation, method, null, null, callback);
            }
        ], callback);
    }

    processKeepAliveResult(session, operation, rpcMessage, callback) {
        if (this._isAsErrorMessage(rpcMessage)) {
            this._createErrorOperationResult(
                session,
                operation,
                EVENTS.onKeepAliveResultReceived,
                session.id,
                operation.getId(),
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
        // Here we have session without search operation, but frontend thinks the session is alive and functioning.
        // Normally the sessions on AS live much longer than ours, so there is a bug here.
        // We would better terminate this session with error message in logs.
        this.logger.error(`Search operation with id ${operation.getId()} is dead on AS,`
            + ' but still exists here! It will be explicitly destroyed.');
        const operationIdToCheck = operation.getOperationIdToCheck();
        async.waterfall([
            (callback) => this.services.operations.find(session, operationIdToCheck, callback),
            (operation, callback) => {
                // AS said it has no such session.
                operation.setSendCloseToAppServer(false);
                callback(null);
            },
            (callback) => this.services.operations.remove(
                session,
                operationIdToCheck,
                (error) => callback(error)
            ),
            (callback) => session.destroy(callback)
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
