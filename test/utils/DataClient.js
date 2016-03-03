'use strict';

const ClientBase = require('./ClientBase');
const RequestWrapper = require('./RequestWrapper');

class DataClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    getUserData(sessionId, languId, callback) {
        RequestWrapper.get(this.urls.data(),
            this._makeHeaders({sessionId,languId}), null, null, callback);
    }
}

module.exports = DataClient;
