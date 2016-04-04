'use strict';

const ClientBase = require('./ClientBase');
const RequestWrapper = require('./RequestWrapper');

class QueryHistoryClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    getClientQueryHistory(sessionId, limit, offset, callback) {
        RequestWrapper.get(
            this.urls.queryHistory(),
            this._makeHeaders({sessionId}),
            {
                limit: limit,
                offset: offset
            },
            null,
            callback
        );
    }
}

module.exports = QueryHistoryClient;