'use strict';

class ModellessServiceBase {
    constructor(services) {
        this.services = services;

        this.config = services.config;
        this.logger = services.logger;
    }

    _checkUserIsSet(user, callback) {
        if (!user) {
            callback(new Error('User undefined'));
        } else {
            callback(null);
        }
    }

    start(callback) {
        this._start(callback);
    }

    _start(callback) {
        callback(null);
    }

    stop(callback) {
        this._stop(callback);
    }

    _stop(callback) {
        callback(null);
    }

    /**
     * @description This function will be executed right after all the services are constructed.
     * */
    init() {}
}

module.exports = ModellessServiceBase;
