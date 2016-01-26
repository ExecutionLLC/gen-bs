'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class SamplesClient extends ClientBase {
    constructor(urls) {
        super(urls);
        this.samplesUrls = this.urls.samplesUrls();
    }

    getAll(sessionId, callback) {
        RequestWrapper.get(this.samplesUrls.getAll(),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    get(sessionId, sampleId, callback) {
        RequestWrapper.get(this.samplesUrls.get(sampleId),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    getFields(sessionId, sampleId, callback) {
        RequestWrapper.get(this.urls.getSampleFields(sampleId),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    getSourcesFields(sessionId, callback) {
        RequestWrapper.get(this.urls.getSourcesFields(),
            this._makeSessionHeader(sessionId), null, null, callback);
    }

    remove(sessionId, sampleId, callback) {
        RequestWrapper.del(this.viewsUrls.remove(sampleId),
            this._makeSessionHeader(sessionId), null, callback);
    }
}

module.exports = SamplesClient;
