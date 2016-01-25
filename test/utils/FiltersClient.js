'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class FiltersClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    getAll(sessionId, callback) {
        RequestWrapper.get(this.urls.getAllFilters(),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    get(sessionId, filterId, callback) {
        RequestWrapper.get(this.urls.getFilter(filterId),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    update(sessionId, filter, callback) {
        RequestWrapper.put(this.urls.updateFilter(filter.id),
            this._makeSessionHeader(sessionId), filter, callback);
    }

    remove(sessionId, filterId, callback) {
        RequestWrapper.del(this.urls.removeFilter(filterId),
            this._makeSessionHeader(sessionId), null, callback);
    }
}

module.exports = FiltersClient;
