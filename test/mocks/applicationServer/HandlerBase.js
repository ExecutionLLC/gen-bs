'use strict';

class HandlerBase {
    constructor(services) {
        this.services = services;

        this.handleCall = this.handleCall.bind(this);
    }

    get methodName() {
        throw new Error('Not implemented');
    }

    handleCall(id, method, params, sendResultCallback, callback) {
        throw new Error('Not implemented');
    }
}

module.exports = HandlerBase;
