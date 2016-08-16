'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');

class RegistrationCodesService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    activate(registrationCodeId, firstName, lastName, userEmail, callback) {
        const {registrationCodes} = this.models;
        this.models.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => registrationCodes.findInactive(registrationCodeId, trx, callback),
                ({speciality, language, numberOfPaidSamples}, callback) => this.services.users.add(language, firstName,
                    lastName, userEmail, speciality, numberOfPaidSamples, callback),
                (user, callback) => registrationCodes.activate(registrationCodeId, userEmail, trx, callback)
            ], callback);
        }, callback);
    }

    createMany(count, language, speciality, description, numberOfPaidSamples, trx, callback) {
        this.models.registrationCodes.createMany(count, language, speciality, description,
            numberOfPaidSamples, trx, callback);
    }
}

module.exports = RegistrationCodesService;
