'use strict';

class Urls {
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }

    session() {
        return this._constructApiUrl('/session');
    }

    data() {
        return this._constructApiUrl('/data');
    }

    startSearch() {
        return this._constructApiUrl('/search');
    }

    startSearchInResults(operationId) {
        return this._constructApiUrl('/search/' + operationId);
    }

    loadNextPage(operationId) {
        return this._constructApiUrl('/search/' + operationId);
    }

    getAllFilters() {
        return this._constructApiUrl('/filters');
    }

    getFilter(filterId) {
        return this._filterUrlWithId(filterId);
    }

    createFilter() {
        return this._constructApiUrl('/filters');
    }

    updateFilter(filterId) {
        return this._filterUrlWithId(filterId);
    }

    removeFilter(filterId) {
        return this._filterUrlWithId(filterId);
    }

    _filterUrlWithId(filterId) {
        return this._constructApiUrl('/filters/' + filterId);
    }

    _constructApiUrl(subUrl) {
        return 'http://' + this.host + ':' + this.port + '/api' + subUrl;
    }
}

module.exports = Urls;