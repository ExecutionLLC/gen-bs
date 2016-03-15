'use strict';

const _ = require('lodash');
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

    /**
     * Gets session from the response.
     *
     * @param response Server response object got from RequestWrapper
     * @param checkSessionType If true, session type will be checked.
     * @param checkSessionIsNotDemo If this and <param>checkSessionType</param>
     * are both true, will check the session type is not demo.
     * */
    static getSessionFromResponse(response, checkSessionType, checkSessionIsNotDemo) {
        assert.equal(response.status, HttpStatus.OK);

        const sessionId = response.body.sessionId;
        if (checkSessionType) {
            const SessionTypes = ['USER', 'DEMO'];
            const sessionType = response.body.sessionType;
            assert.ok(sessionId, 'Session is undefined.');
            assert.ok(_.includes(SessionTypes, sessionType));

            if (checkSessionIsNotDemo) {
                assert.equal(sessionType, 'USER');
            }
        }

        return sessionId;
    }
}

module.exports = SessionsClient;
