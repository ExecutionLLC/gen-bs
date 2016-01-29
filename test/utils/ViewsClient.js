'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class ViewsClient extends ClientBase {
    constructor(urls) {
        super(urls);
        this.viewsUrls = this.urls.viewsUrls();
    }

    getAll(sessionId, callback) {
        RequestWrapper.get(this.viewsUrls.getAll(),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    get(sessionId, viewId, callback) {
        RequestWrapper.get(this.viewsUrls.get(viewId),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    add(sessionId, languId, view, callback) {
        RequestWrapper.post(this.viewsUrls.add(),
            this._makeHeaders({sessionId, languId}), view, callback);
    }

    update(sessionId, view, callback) {
        RequestWrapper.put(this.viewsUrls.update(view.id),
            this._makeHeaders({sessionId}), view, callback);
    }

    remove(sessionId, viewId, callback) {
        RequestWrapper.del(this.viewsUrls.remove(viewId),
            this._makeHeaders({sessionId}), null, callback);
    }
}

module.exports = ViewsClient;
