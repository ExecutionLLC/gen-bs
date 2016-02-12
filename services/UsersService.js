'use strict';

const ServiceBase = require('./ServiceBase');

const DEMO_USER = {
    "id": "00000000-0000-0000-0000-000000000000",
    "name": "Doctor",
    "last_name": "Demo",
    "email": "demo@demo.com",
    "speciality": "doctor",
    "language": "en",
    "number_paid_samples": 0
};

const SYSTEM_USER = {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "System",
    "last_name": "Super",
    "email": "system@genomix.com",
    "speciality": "system",
    "language": "en",
    "number_paid_samples": 0
};

class UserService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    findDemoUser(callback) {
        callback(null, DEMO_USER);
    }

    findSystemUser(callback) {
        callback(null, SYSTEM_USER);
    }

    find(userId, callback) {
        if (userId === DEMO_USER.id) {
            callback(null, DEMO_USER);
        } else if (userId === SYSTEM_USER.id) {
            callback(null, SYSTEM_USER);
        } else {
            this.models.user.find(userId, callback);
        }
    }
}

module.exports = UserService;
