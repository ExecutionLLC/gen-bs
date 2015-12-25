'use strict';

const _ = require('lodash');

const USER_METADATA = require('../test_data/user_metadata.json');
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
    constructor(services) {
        super(services);

        this.users = USER_METADATA;
    }

    findDemoUser(callback) {
        callback(null, DEMO_USER);
    }

    find(userId, callback) {
        if (userId === DEMO_USER.id) {
            callback(null, DEMO_USER);
        } else {
            const user = _.find(this.users, user => user.id === userId);
            if (user) {
                callback(null, user);
            } else {
                callback(new Error('User is not found.'));
            }
        }
    }
}

module.exports = UserService;
