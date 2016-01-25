'use strict';

function _constructApiUrl(subUrl, host, port) {
    return 'http://' + host + ':' + port + '/api' + subUrl;
}

class CollectionUrls {
    constructor(baseUrl, host, port) {
        this.baseUrl = baseUrl;
        this.host = host;
        this.port = port;
    }

    getAll() {
        return this._constructApiUrl(this.baseUrl);
    }

    get(itemId) {
        return this._createUrlForId(itemId);
    }

    create() {
        return this._constructApiUrl(this.baseUrl);
    }

    update(itemId) {
        return this._createUrlForId(itemId);
    }

    remove(itemId) {
        return this._createUrlForId(itemId);
    }

    _createUrlForId(itemId) {
        return this._constructApiUrl(this.baseUrl + '/' + itemId);
    }

    _constructApiUrl(subUrl) {
        const url = subUrl ? this.baseUrl + '/' + subUrl : this.baseUrl;
        return _constructApiUrl(url, this.host, this.port);
    }
}

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

    getAllFields() {
        return this._constructApiUrl('/fields');
    }

    getSampleFields(sampleId) {
        return this._constructApiUrl('/fields/' + sampleId);
    }

    startSearchInResults(operationId) {
        return this._constructApiUrl('/search/' + operationId);
    }

    loadNextPage(operationId) {
        return this._constructApiUrl('/search/' + operationId);
    }

    viewsUrls() {
        return new CollectionUrls('/views', this.host, this.port);
    }

    filtersUrls() {
        return new CollectionUrls('/filters', this.host, this.port);
    }

    samplesUrls() {
        return new CollectionUrls('/samples', this.host, this.port);
    }

    _constructApiUrl(subUrl) {
        return _constructApiUrl(subUrl, this.host, this.port);
    }
}

module.exports = Urls;