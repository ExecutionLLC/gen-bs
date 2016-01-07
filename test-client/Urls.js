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

    _constructApiUrl(subUrl) {
        return 'http://' + this.host + ':' + this.port + '/api' + subUrl;
    }
}

module.exports = Urls;