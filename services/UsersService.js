'use strict';

const Uuid = require('node-uuid');

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

    /**
     * Adds a new user with specified params.
     * @param defaultLanguId User's default language.
     * @param name First name.
     * @param lastName Last name.
     * @param speciality User's job position name.
     * @param numberPaidSamples Number of times user is allowed to analyze a new sample.
     * @param email User email.
     * @param callback (error, userId)
     * */
    add(defaultLanguId, name, lastName, email, speciality, numberPaidSamples, callback) {
        const user = {
            name,
            lastName,
            email,
            speciality,
            language: defaultLanguId,
            numberPaidSamples
        };

        this.models.user.add(user, defaultLanguId, callback);
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
