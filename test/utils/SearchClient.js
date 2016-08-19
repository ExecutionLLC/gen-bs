'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class SearchClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    sendSearchRequest(sessionId, languId, analysis, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({sessionId, languId}),
            {
                languId,
                analysis,
                limit,
                offset
            },
            callback
        );
    }

    sendSearchInResultsRequest(sessionId, operationId, globalSearch,
                               fieldIdToSearchObject, fieldIdToOrderAndDirection, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearchInResults(operationId),
            this._makeHeaders({sessionId}),
            {
                topSearch: globalSearch,
                search: fieldIdToSearchObject,
                sort: fieldIdToOrderAndDirection,
                limit,
                offset
            },
            callback
        );
    }
}

module.exports = SearchClient;
