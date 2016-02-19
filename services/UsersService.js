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

class UserService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    findDemoUser(callback) {
        callback(null, DEMO_USER);
    }

    findIdByEmail(email, callback) {
        this.models.user.findIdByEmail(email, callback);
    }

    find(userId, callback) {
        if (userId === DEMO_USER.id) {
            callback(null, DEMO_USER);
        } else {
            this.models.user.find(userId, callback);
        }
    }
}

module.exports = UserService;
