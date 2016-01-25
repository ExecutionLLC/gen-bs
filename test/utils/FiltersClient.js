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
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    get(sessionId, filterId, callback) {
        RequestWrapper.get(this.filtersUrls.get(filterId),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    add(sessionId, filter, callback) {
        RequestWrapper.post(this.filtersUrls.create(),
            this._makeSessionHeader(sessionId), filter, callback);
    }

    update(sessionId, filter, callback) {
        RequestWrapper.put(this.filtersUrls.update(filter.id),
            this._makeSessionHeader(sessionId), filter, callback);
    }

    remove(sessionId, filterId, callback) {
        RequestWrapper.del(this.filtersUrls.remove(filterId),
            this._makeSessionHeader(sessionId), null, callback);
    }
}

module.exports = FiltersClient;
