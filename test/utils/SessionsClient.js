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
        RequestClient.put(this.urls.session(), {
            SESSION_HEADER: sessionId
        }, null, callback);
    }

    closeSession(sessionId, callback) {
        RequestClient.del(this.urls.session(), {
            SESSION_HEADER: sessionId
        }, null, callback);
    }
}

module.exports = SessionsClient;
