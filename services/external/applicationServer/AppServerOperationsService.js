'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');

class AppServerOperationsService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    requestKeepOperationAlive(sessionId, searchOperationId, callback) {
        const method = METHODS.keepAlive;
        const operationTypes = this.services.operations.operationTypes();
        async.waterfall([
            (callback) => this.services.operations.ensureOperationOfType(sessionId, searchOperationId, operationTypes.SEARCH, callback),
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (sessionId, callback) => this.services.operations.addKeepAliveOperation(sessionId, searchOperationId, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, {sessionId: searchOperationId}, callback)
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
                const method = METHODS.closeSession;
                this._rpcSend(operation.getId(), method, null, callback);
            }
        ], callback);
    }

    requestOperationState(operationId, callback) {
        this._rpcSend(operationId, METHODS.checkSession, null, callback);
    }
}

module.exports = AppServerOperationsService;
