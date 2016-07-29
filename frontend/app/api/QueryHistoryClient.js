'use strict';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

export default class QueryHistoryClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls);
    }

    getQueryHistory(languageId, filter, limit, offset, callback) {
        RequestWrapper.get(this.urls.history(),
            this._makeHeaders({languageId}), {filter, limit, offset}, null, callback);
    }
}
