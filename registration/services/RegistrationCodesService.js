'use strict';

const Promise = require('bluebird');

class RegistrationCodesService {
    constructor(db, registrationCodes) {
        this.db = db;
        this.registrationCodes = registrationCodes;
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

    createManyAsync(count, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodes} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodes.createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx)
        );
    }
}

module.exports = RegistrationCodesService;
