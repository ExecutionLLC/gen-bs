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
        return this._constructApiUrl();
    }

    get(itemId) {
        return this._createUrlForId(itemId);
    }

    create() {
        return this._constructApiUrl();
    }

    update(itemId) {
        return this._createUrlForId(itemId);
    }

    remove(itemId) {
        return this._createUrlForId(itemId);
    }

    _createUrlForId(itemId) {
        return this._constructApiUrl(itemId);
    }

    _constructApiUrl(subUrl) {
        const url = subUrl ? this.baseUrl + '/' + subUrl : this.baseUrl;
        return _constructApiUrl(url, this.host, this.port);
    }
}

class UploadableEntityUrls extends CollectionUrls {
    constructor(baseUrl, host, port) {
        super(baseUrl, host, port);
    }

    upload() {
        return this._constructApiUrl('/upload');
    }
}

class SavedFilesUrls extends UploadableEntityUrls {
    constructor(baseUrl, host, port) {
        super(baseUrl, host, port);
    }

    download(itemId) {
        const itemUrl = this._createUrlForId(itemId);
        return itemUrl + '/download';
    }
}

export default class Urls {
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

    getSourcesFields() {
        return this._constructApiUrl('/fields/sources');
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
        return new UploadableEntityUrls('/samples', this.host, this.port);
    }

    commentsUrls() {
        return new CollectionUrls('/comments', this.host, this.port);
    }

    savedFilesUrls() {
        return new SavedFilesUrls('/files', this.host, this.port);
    }

    _constructApiUrl(subUrl) {
        return _constructApiUrl(subUrl, this.host, this.port);
    }
}
