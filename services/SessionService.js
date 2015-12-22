'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

const OPERATION_TYPES = {
    SEARCH: 'search',
    UPLOAD: 'upload'
}

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);
        this.sessions = {};
    }

    static operationTypes() {
        return OPERATION_TYPES;
    }

    startSessionForUser(userId) {
        let sessionId = _.findKey(this.sessions, {'userId': userId});
        if (!sessionId) {
            sessionId = uuid.v4();
        }
        this.sessions[sessionId] = {
            lastActivity: Date.now(),
            userId: userId,
            operations: {}
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

    _deleteOperation(session, operationId) {
        if (session.operations[operationId]) {
            delete session.operations[operationId];
        }
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

    findOperation(operationId) {
        let session = _.find(this.sessions, (session) => {
            return _.findKey(session.operations, {id: operationId});
        });

        if (session) {
            return session.operations[operationId];
        }
    }
}

module.exports = SessionService;