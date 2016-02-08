'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class FiltersClient extends ClientBase {
    constructor(urls) {
        super(urls);

        this.filtersUrls = urls.filtersUrls();
    }

    getAll(sessionId, callback) {
        RequestWrapper.get(this.filtersUrls.getAll(),
            this._makeHeaders({sessionId}, null), null, null, callback);
    }

    get(sessionId, filterId, callback) {
        RequestWrapper.get(this.filtersUrls.get(filterId),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    add(sessionId, languId, filter, callback) {
        RequestWrapper.post(this.filtersUrls.create(),
            this._makeHeaders({sessionId, languId}), filter, callback);
    }

    update(sessionId, filter, callback) {
        RequestWrapper.put(this.filtersUrls.update(filter.id),
            this._makeHeaders({sessionId}), filter, callback);
    }

    remove(sessionId, filterId, callback) {
        RequestWrapper.del(this.filtersUrls.remove(filterId),
            this._makeHeaders({sessionId}), null, callback);
    }
}

module.exports = FiltersClient;
