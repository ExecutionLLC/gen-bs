'use strict';

import RequestWrapper from './RequestWrapper';
import ClientBase from './ClientBase';

export default class UserEntityClientBase extends ClientBase {
    constructor(urls, collectionUrls) {
        super(urls);
        this.collectionUrls = collectionUrls;
    }

    getAll(callback) {
        RequestWrapper.get(this.collectionUrls.getAll(), null, null, callback);
    }

    get(itemId, callback) {
        RequestWrapper.get(this.collectionUrls.get(itemId), null, null, callback);
    }

    add(languId, item, callback) {
        RequestWrapper.post(this.collectionUrls.create(),
            this._makeHeaders({languId}), item, callback);
    }

    update(item, callback) {
        RequestWrapper.put(this.collectionUrls.update(item.id), item, callback);
    }

    remove(itemId, callback) {
        RequestWrapper.del(this.collectionUrls.remove(itemId), null, callback);
    }
}
