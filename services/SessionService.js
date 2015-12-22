'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);
        this.sessions = {};
    }

    removeSession(sessionId) {
        if (this.sessions[sessionId]) {
            delete this.sessions[sessionId];
        }
    }

    addOperation(sessionId, method) {
        if (!this.sessions[sessionId]) {
            this.sessions[sessionId] = {};
        }
        let session = this.sessions[sessionId];

        const operationId = uuid.v4();
        session[operationId] = {'method': method};
        return operationId;
    }

    findSessionByOperationId(operationId) {
        return _.find(this.sessions, function(session) {
            return session[operationId];
        })
    }

    findOperation(operationId) {
        const session = this.findSessionByOperationId(operationId);
        if (session) {
            return session[operationId];
        }
        return null;
    }

    removeOperation(operationId) {
        let session = this.findSessionByOperationId(operationId);
        if (session) {
            delete session[operationId];
        }
    }

    updateOperation(err, message) {
        if (err) {
            // TODO: add log event here
        } else {
            const msg = JSON.parse(message);
            const operationId = msg.id;
            const operationState = msg.result.session_state.status;

        }
    }
}

module.exports = SessionService;