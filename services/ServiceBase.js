'use strict';

class ServiceBase {
    constructor(services, models) {
        this.services = services;
        this.models = models;

        this.config = services.config;
        this.logger = services.logger;
    }

    _checkUserIsSet(user, errorCallback) {
        if (!user) {
            errorCallback(new Error('User undefined'));
            return false;
        }
        return true;
    }
}

module.exports = ServiceBase;
