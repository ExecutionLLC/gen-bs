'use strict';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class SearchClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    sendSearchRequest(sessionId, languId, sampleId, viewId, filterId, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({sessionId, languId}),
            {
                languId,
                sampleId,
                viewId,
                filterId,
                limit,
                offset
            },
            callback
        );
    }

    sendSearchInResultsRequest(sessionId, operationId, globalSearch, limit, offset,
                               fieldIdToSearchObject, fieldIdToOrderAndDirection, callback) {
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
    
    sendGetNextPartOfData(sessionId, operationId, offset, limit, callback) {
        RequestWrapper.get(
            this.urls.startSearchInResults(operationId),
            this._makeHeaders({sessionId}),
            {
                offset,
                limit
            },
            null,
            callback
        );
    }
}
