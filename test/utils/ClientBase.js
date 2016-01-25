'use strict';

const Config = require('../../utils/Config');

const SESSION_HEADER = Config.sessionHeader;

class ClientBase {
    constructor(urls) {
        this.urls = urls;
    }

    _makeSessionHeader(sessionId) {
        const headers = {};
        headers[SESSION_HEADER] = sessionId;
        return headers;
    }
}

module.exports = ClientBase;
