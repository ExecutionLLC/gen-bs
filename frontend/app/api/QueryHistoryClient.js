'use strict';

import RequestWrapper from './RequestWrapper'
import UserEntityClientBase from './UserEntityClientBase';

export default class QueryHistoryClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.filtersUrls());
    }

    getQueryHistory(sessionId, languageId, limit, offset, callback) {
        RequestWrapper.get(this.urls.data(),
            this._makeHeaders({sessionId, languageId}), null, {limit, offset}, callback);
    }
}
