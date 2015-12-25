'use strict';

class ServiceBase {
    constructor(services, models) {
        this.services = services;
        this.models = models;
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
