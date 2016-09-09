'use strict';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

export default class QueryHistoryClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.queryHistoryUrls());
    }

    getQueryHistory(languageId, filter, limit, offset, callback) { // TODO rename argument
        RequestWrapper.get(this.urls.history(),
            this._makeHeaders({languageId}), {search: filter, limit, offset}, null, callback);
    }
}
