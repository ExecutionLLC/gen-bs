'use strict';

import HttpStatus from 'http-status';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class SessionsClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    openUserSession(login, password, callback) {
        RequestWrapper.post(this.urls.session(), null, {
            login,
            password
        }, callback);
    }

    openDemoSession(callback) {
        RequestWrapper.post(this.urls.session(), null, null, callback);
    }

    checkSession(callback) {
        RequestWrapper.put(this.urls.session(), null, null, callback);
    }

    closeSession(callback) {
        RequestWrapper.del(this.urls.session(), null, null, callback);
    }

    closeAllUserSessions(callback) {
        RequestWrapper.del(`${this.urls.session()}/all`, null, null, callback);
    }

    closeOtherSockets(callback) {
        RequestWrapper.del(`${this.urls.session()}/socket`, null, null, callback);
    }

    /**
     * Gets session from the response.
     *
     * @param response Server response object got from RequestWrapper
     * */
    static getSessionFromResponse(response) {
        if (response.status !== HttpStatus.OK) {
            return null;
        }

        const sessionId = response.body && response.body.sessionId;
        if (!sessionId) {
            return null;
        }

        return sessionId;
    }
}
