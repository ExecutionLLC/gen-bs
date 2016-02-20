'use strict';

const ServiceBase = require('./ServiceBase');

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

class UserService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.models.user.find(DEMO_USER_ID, (error, user) => {
            if (error) {
                throw new Error('Cannot find demo user: ' + error);
            } else {
                this.demoUser = user;
            }
        });
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

    /**
     * Returns true if the specified user id is id of the demo user.
     * */
    isDemoUserId(userId) {
        return userId === DEMO_USER_ID;
    }

    /**
     * If the specified user id is of demo user, calls back with error,
     * otherwise callbacks with null.
     * @param userId User id to check.
     * @param callback (error || null)
     * */
    ensureUserIsNotDemo(userId, callback) {
        if (this.isDemoUserId(userId)) {
            callback(new Error('The action is not allowed for demo user.'));
        } else {
            callback(null);
        }
    }

    findDemoUser(callback) {
        callback(null, this.demoUser);
    }

    findIdByEmail(email, callback) {
        this.models.user.findIdByEmail(email, callback);
    }

    find(userId, callback) {
        if (userId === DEMO_USER_ID) {
            callback(null, this.demoUser);
        } else {
            this.models.user.find(userId, callback);
        }
    }
}

module.exports = UserService;
