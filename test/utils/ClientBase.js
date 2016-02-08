'use strict';

const Config = require('../../utils/Config');

const SESSION_HEADER = Config.sessionHeader;
const LANGUAGE_HEADER = Config.languageHeader;

class ClientBase {
    constructor(urls) {
        this.urls = urls;
    }

    _makeHeaders(headersObj) {
        const headers = {};
        headers[SESSION_HEADER] = headersObj.sessionId;
        headers[LANGUAGE_HEADER] = headersObj.languId;
        return headers;
    }
}

module.exports = ClientBase;
