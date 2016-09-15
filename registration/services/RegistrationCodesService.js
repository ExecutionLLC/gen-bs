'use strict';

const async = require('async');
const Promise = require('bluebird');

class RegistrationCodesService {
    constructor(db, registrationCodes) {
        this.db = db;
        this.registrationCodes = registrationCodes;
    }

    activate(registrationCodeId, firstName, lastName, userEmail, callback) {
        return this.activateAsync(registrationCodeId, firstName, lastName, userEmail)
            .asCallback(callback);
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {db, registrationCodes} = this;
        return Promise.fromCallback((callback) => db.transactionally((trx, callback) => {
            registrationCodes.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality, language, numberOfPaidSamples}) => Promise.fromCallback((callback) => {
/* TODO restore functionality
                    this.services.users.add(language, firstName, lastName, userEmail,
                        speciality, numberOfPaidSamples, callback);
*/
                    callback();
                }))
                .then(() => registrationCodes.activateAsync(registrationCodeId, userEmail, trx, callback))
                .asCallback(callback);
        }, callback));
    }

    createMany(count, language, speciality, description, numberOfPaidSamples, callback) {
        return this.createManyAsync(count, language, speciality, description, numberOfPaidSamples)
            .asCallback(callback);
    }

    createManyAsync(count, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodes} = this;
        return Promise.fromCallback((callback) => db.transactionally((trx, callback) => {
            registrationCodes.createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx)
                .asCallback(callback);
        }, callback))
    }
}

module.exports = RegistrationCodesService;
