'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);
        this.sessions = {};
    }

    startSessionForUser(userId) {
        let sessionId = _.findKey(this.sessions, {'userId': userId});
        if (!sessionId) {
            sessionId = uuid.v4();
        }
        this.sessions[sessionId] = {
            lastActivity: Date.now(),
            userId: userId,
            searchOperations: {},
            uploadOperations: {}
        }
    }

    _sessionByUser(userId) {
        return _.find(this.sessions, function(session) {
            return session.userId == userId;
        });
    }

    _checkSession(sessionId) {
        if (!this.sessions[sessionId]) {
            // throw new exception
        }
    }

    deleteSession(sessionId) {
        if (this.sessions[sessionId]) {
            delete this.sessions[sessionId];
        }
    }

    addSearchOperation(sessionId, method) {
        this.checkSession(sessionId);

        let session = this.sessions[sessionId];
        session.lastActivity = Date.now();
        session.searchOperations = {};

        const operationId = uuid.v4();
        session.searchOperations[operationId] = {'progress': 0, 'method': method};
        return operationId;
    }

    addUploadOperation(sessionId, method) {
        this.checkSession(sessionId);

        const operationId = uuid.v4();
        let session = this.sessions[sessionId];
        session.uploadOperations[operationId] = {'progress': 0, 'method': method};
        session.lastActivity = Date.now();
        return operationId;
    }

    findOperation(operationId) {

    }

    _findSessionForSearchOperation(operationId) {

    }

    _findSessionForUploadOperation(operationId) {

    }

    //_findSearchOperation(operationId) {
    //    _.each(this.sessions, function(session, sessionId) {
    //        return session.searchOperations[operationId];
    //    });
    //}
    //
    //_findUploadOperation(operationId) {
    //    _.each(this.sessions, function(session, sessionId) {
    //        return session.uploadOperations[operationId];
    //    });
    //}

    deleteUploadOperation(operationId) {
        let session = this._findSessionForUploadOperation(operationId);
        if (session) {
            delete session.uploadOperations[operationId];
        }
    }
}

module.exports = SessionService;