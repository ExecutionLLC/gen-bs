'use strict';

class RegistrationCodesService {
    constructor(db, registrationCodesModel, usersClient) {
        this.db = db;
        this.registrationCodesModel = registrationCodesModel;
        this.usersClient = usersClient;
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {db, registrationCodesModel} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality, language, numberOfPaidSamples}) =>
                    this.usersClient.addAsync('en', {firstName, lastName, userEmail, speciality, numberOfPaidSamples})
                )
                .then(() => registrationCodesModel.activateAsync(registrationCodeId, userEmail, trx))
        );
    }

    createManyAsync(count, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodesModel} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx)
        );
    }
}

module.exports = RegistrationCodesService;
