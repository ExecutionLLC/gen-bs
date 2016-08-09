'use strict';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class SearchClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    sendSearchRequest(languId, analysis, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({languId}),
            {
                languId,
                analysis,
                limit,
                offset
            },
            callback
        );
    }

    sendSearchAgainRequest(languId, analysisId, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({languId}),
            {
                languId,
                analysis: {id: analysisId},
                limit,
                offset
            },
            callback
        );
    }

    sendSearchInResultsRequest(operationId, globalSearch, limit, offset,
                               fieldIdToSearchObject, fieldIdToOrderAndDirection, callback) {
        RequestWrapper.post(
            this.urls.startSearchInResults(operationId),
            null,
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

    sendGetNextPartOfData(operationId, offset, limit, callback) {
        RequestWrapper.get(
            this.urls.startSearchInResults(operationId),
            null,
            {
                offset,
                limit
            },
            null,
            callback
        );
    }
}
