'use strict';

const assert = require('assert');
const HttpStatus = require('http-status');

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class SessionsClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    openSession(userEmail, callback) {
        RequestWrapper.post(this.urls.session(), null, {
            email: userEmail
        }, callback);
    }

    checkSession(sessionId, callback) {
        RequestWrapper.put(this.urls.session(),
            this._makeHeaders({sessionId}), null, callback);
    }

    closeSession(sessionId, callback) {
        RequestWrapper.del(this.urls.session(),
            this._makeHeaders({sessionId}), null, callback);
    }

    static getSessionFromResponse(response) {
        assert.equal(response.status, HttpStatus.OK);
        const sessionId = response.body.sessionId;
        assert.ok(sessionId, 'Session is undefined.');
        return sessionId;
    }
}

module.exports = SessionsClient;
