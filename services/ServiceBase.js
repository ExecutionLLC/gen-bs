'use strict';

class ServiceBase {
    constructor(services, models) {
        this.services = services;
        this.models = models;

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
}

module.exports = ServiceBase;
