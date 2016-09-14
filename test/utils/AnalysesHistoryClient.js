'use strict';

const ClientBase = require('./ClientBase');
const RequestWrapper = require('./RequestWrapper');

class AnalysesHistoryClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    getClientAnalysesHistory(sessionId, limit, offset, callback) {
        RequestWrapper.get(
            this.urls.queryHistory(),
            this._makeHeaders({sessionId}),
            {
                limit,
                offset
            },
            null,
            callback
        );
    }
}

module.exports = AnalysesHistoryClient;