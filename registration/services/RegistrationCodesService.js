'use strict';

const Promise = require('bluebird');

class RegistrationCodesService {
    constructor(db, registrationCodes, usersClient) {
        this.db = db;
        this.registrationCodes = registrationCodes;
        this.usersClient = usersClient;
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {db, registrationCodes} = this;
        return Promise.fromCallback((callback) => db.transactionally((trx, callback) => {
            registrationCodes.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality, language, numberOfPaidSamples}) =>
                    this.usersClient.addAsync('en', {firstName, lastName, userEmail, speciality, numberOfPaidSamples})
                )
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
