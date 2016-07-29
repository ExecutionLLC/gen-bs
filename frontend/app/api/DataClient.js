'use strict';

import ClientBase from './ClientBase';
import RequestWrapper from './RequestWrapper';

export default class DataClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    getUserData(languageId, callback) {
        RequestWrapper.get(this.urls.data(),
            this._makeHeaders({languageId}), null, null, callback);
    }
}
