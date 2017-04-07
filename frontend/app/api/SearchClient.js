'use strict';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class SearchClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    sendSearchRequest(languageId, analysis, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({languageId}),
            {
                analysis,
                limit,
                offset
            },
            callback
        );
    }

    sendSearchAgainRequest(languageId, analysisId, limit, offset, callback) {
        RequestWrapper.post(
            this.urls.startSearch(),
            this._makeHeaders({languageId}),
            {
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
                topSearch: {
                    filter: globalSearch.search
                },
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
