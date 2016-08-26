'use strict';

const async = require('async');
const Promise = require('bluebird');

const ServiceBase = require('./ServiceBase');

class RegistrationCodesService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    activate(registrationCodeId, firstName, lastName, userEmail, callback) {
        return this.activateAsync(registrationCodeId, firstName, lastName, userEmail)
            .asCallback(callback);
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {registrationCodes, db} = this.models;
        return Promise.fromCallback((callback) => db.transactionally((trx, callback) => {
            registrationCodes.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality, language, numberOfPaidSamples}) => Promise.fromCallback((callback) => {
                    this.services.users.add(language, firstName, lastName, userEmail,
                        speciality, numberOfPaidSamples, callback);
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
        const {db, registrationCodes} = this.models;
        return Promise.fromCallback((callback) => db.transactionally((trx, callback) => {
            registrationCodes.createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx)
                .asCallback(callback);
        }, callback))
    }
}

module.exports = RegistrationCodesService;