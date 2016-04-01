'use strict';

import RequestWrapper from './RequestWrapper'
import UserEntityClientBase from './UserEntityClientBase';

export default class QueryHistoryClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls);
    }

    getQueryHistory(sessionId, languageId, limit, offset, callback) {
        RequestWrapper.get(this.urls.history(),
            this._makeHeaders({sessionId, languageId}), {limit, offset}, null, callback);
    }
}
