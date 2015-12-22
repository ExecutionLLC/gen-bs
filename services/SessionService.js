'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

const SYSTEM_USER_ID = '9c952e80-c2db-4a09-a0b0-6ea667d254a1';

const OPERATION_TYPES = {
    SYSTEM: 'system',
    SEARCH: 'search',
    UPLOAD: 'upload'
}

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);
        this.sessions = {};
    }

    systemUserId() {
        return SYSTEM_USER_ID;
    }

    operationTypes() {
        return OPERATION_TYPES;
    }

    startSessionForUser(userId) {
        let sessionId = _.findKey(this.sessions, {'userId': userId});
        if (!sessionId) {
            sessionId = uuid.v4();
            this.sessions[sessionId] = {
                lastActivity: Date.now(),
                userId: userId,
                operations: {}
            }
        }
        return sessionId;
    }

    _sessionByUser(userId) {
        return _.find(this.sessions, (session) => {
            return session.userId == userId;
        });
    }

    _checkSession(sessionId) {
        if (!this.sessions[sessionId]) {
            // TODO: throw new exception
        }
    }

    deleteSession(sessionId) {
        if (this.sessions[sessionId]) {
            delete this.sessions[sessionId];
        }
    }

    _addOperation(session, operationType, method) {
        const operationId = uuid.v4();
        session.operations[operationId] = {'id': operationId, 'type': operationType, 'progress': 0, 'method': method};
        return operationId;
    }

    deleteOperation(operationId) {
        let session = this._findSession(operationId);
        if (session) {
            this._deleteOperation(session, operationId);
        }
    }

    _deleteOperation(session, operationId) {
        delete session.operations[operationId];
    }

    addSystemOperation(method) {
        const sessionId = this.startSessionForUser(SYSTEM_USER_ID);
        return this._addOperation(this.sessions[sessionId], OPERATION_TYPES.SYSTEM, method);
    }

    addSearchOperation(sessionId, method) {
        this._checkSession(sessionId);
        let session = this.sessions[sessionId];
        session.lastActivity = Date.now();

        const lastSearchOperationId = this._lastSearchOperationId(session);
        if (lastSearchOperationId) {
            this._deleteOperation(session, lastSearchOperationId);
        }
        return this._addOperation(session, OPERATION_TYPES.SEARCH, method);
    }

    addUploadOperation(sessionId, method) {
        this.checkSession(sessionId);
        let session = this.sessions[sessionId];
        session.lastActivity = Date.now();

        return this._addOperation(session, OPERATION_TYPES.UPLOAD, method);
    }

    _lastSearchOperationId(session) {
        return _.findKey(session.operations, (operation) => {
           return operation.type == OPERATION_TYPES.SEARCH;
        });
    }

    _findSession(operationId) {
        return _.find(this.sessions, (session) => {
            return _.findKey(session.operations, {id: operationId});
        });
    }

    findOperation(operationId) {
        const session = this._findSession(operationId);
        if (session) {
            return session.operations[operationId];
        }
    }
}

module.exports = SessionService;