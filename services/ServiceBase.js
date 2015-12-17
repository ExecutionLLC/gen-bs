'use strict';

class ServiceBase {
    constructor(services) {
        this.services = services;
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
