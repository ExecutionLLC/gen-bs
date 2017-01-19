'use strict';

import config from '../../config';

export default class ClientBase {
    constructor(urls) {
        this.urls = urls;
    }

    _makeHeaders(headersObj) {
        const headers = {};
        headers[config.HEADERS.SESSION] = headersObj.sessionId;
        headers[config.HEADERS.LANGUAGE] = headersObj.languageId;
        return headers;
    }
}
