'use strict';

const RequestClient = require('./RequestClient');
const Config = require('../../utils/Config');

const SESSION_HEADER = Config.sessionHeader;

class SessionsClient {
    constructor(urls) {
        this.urls = urls;
    }

    openSession(userName, password, callback) {
        RequestClient.post(this.urls.session(), null, {
            userName,
            password
        }, callback);
    }

    checkSession(sessionId, callback) {
        RequestClient.put(this.urls.session(),
            this._makeSessionHeader(sessionId), null, callback);
    }

    closeSession(sessionId, callback) {
        RequestClient.del(this.urls.session(),
            this._makeSessionHeader(sessionId), null, callback);
    }

    _makeSessionHeader(sessionId) {
        const headers = {};
        headers[SESSION_HEADER] = sessionId;
        return headers;
    }
}

module.exports = SessionsClient;
