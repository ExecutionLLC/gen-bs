'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class SearchClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    sendSearchRequest(sessionId, sampleId, viewId, filterId, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeSessionHeader(sessionId),
            {
                sampleId,
                viewId,
                filterId,
                limit,
                offset
            },
            callback
        );
    }

    sendSearchInResultsRequest(sessionId, operationId, globalSearch,
                               fieldIdToSearchObject, fieldIdToOrderAndDirection, callback) {
        RequestWrapper.get(
            this.urls.startSearchInResults(operationId),
            this._makeSessionHeader(sessionId),
            null,
            {
                topSearch: globalSearch,
                search: fieldIdToSearchObject,
                sort: fieldIdToOrderAndDirection
            },
            callback
        );
    }
}

module.exports = SearchClient;
