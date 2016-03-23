'use strict';

import _ from 'lodash';
import HttpStatus from 'http-status';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class SessionsClient extends ClientBase {
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
        if (response.status !== HttpStatus.OK) {
            return null;
        }

        const sessionId = response.body.sessionId;
        if (!sessionId) {
            return null;
        }

        if (checkSessionType) {
            const SessionTypes = ['USER', 'DEMO'];
            const sessionType = response.body.sessionType;
            if (_.includes(SessionTypes, sessionType)) {
                return null;
            }

            if (checkSessionIsNotDemo && sessionType !== 'USER') {
                return null;
            }
        }

        return sessionId;
    }
}
