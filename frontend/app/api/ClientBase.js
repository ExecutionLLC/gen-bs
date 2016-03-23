'use strict';

const assert = require('assert');
const HttpStatus = require('http-status');

import config from '../../config'

const SESSION_HEADER = 'X-Session-Id';
const LANGUAGE_HEADER = 'X-Langu-Id';

export default class ClientBase {
    constructor(urls) {
        this.urls = urls;
    }

    _makeHeaders(headersObj) {
        const headers = {};
        headers[SESSION_HEADER] = headersObj.sessionId;
        headers[LANGUAGE_HEADER] = headersObj.languId;
        return headers;
    }

    static readBodyWithCheck(error, response) {
        assert.ifError(error);
        assert.equal(response.status, HttpStatus.OK, JSON.stringify(response.body));
        return response.body;
    }

    static expectErrorResponse(error, response) {
        assert.ifError(error);
        assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
        assert.ok(response.body);
        assert.equal(typeof response.body, 'object');

        const errorMessage = response.body;
        assert.ok(errorMessage.code);
        assert.ok(errorMessage.message);
    }
}
