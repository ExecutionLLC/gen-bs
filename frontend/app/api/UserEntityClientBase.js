'use strict';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class UserEntityClientBase extends ClientBase {
    constructor(urls, collectionUrls) {
        super(urls);
        this.collectionUrls = collectionUrls;
    }

    getAll(callback) {
        RequestWrapper.get(this.collectionUrls.getAll(), null, null, null, callback);
    }

    get(itemId, callback) {
        RequestWrapper.get(this.collectionUrls.get(itemId), null, null, null, callback);
    }

    add(languageId, item, callback) {
        RequestWrapper.post(this.collectionUrls.create(),
            this._makeHeaders({languageId}), item, callback);
    }

    update(item, callback) {
        RequestWrapper.put(this.collectionUrls.update(item.id), null, item, callback);
    }

    remove(itemId, callback) {
        RequestWrapper.del(this.collectionUrls.remove(itemId), null, null, callback);
    }
}
