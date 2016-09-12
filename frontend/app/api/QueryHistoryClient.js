'use strict';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

export default class QueryHistoryClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.queryHistoryUrls());
    }

    getQueryHistory(languageId, search, limit, offset, callback) {
        RequestWrapper.get(this.urls.history(),
            this._makeHeaders({languageId}), {search, limit, offset}, null, callback);
    }
}
