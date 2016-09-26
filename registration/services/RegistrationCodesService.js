'use strict';

class RegistrationCodesService {
    /**@typedef {Object} RegistrationCodesService
     * @property {KnexWrapper} db
     * @property {RegistrationCodesModel} registrationCodesModel
     * @property {UsersClient|MockUsersClient} usersClient
     **/

    constructor(db, registrationCodesModel, usersClient) {
        this.db = db;
        this.registrationCodesModel = registrationCodesModel;
        this.usersClient = usersClient;
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {db, registrationCodesModel, usersClient} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality, language, numberOfPaidSamples}) =>
                    usersClient.addAsync('en', {firstName, lastName, userEmail, speciality, numberOfPaidSamples})
                )
                .then(() => registrationCodesModel.activateAsync(registrationCodeId, userEmail, trx))
        );
    }

    createAsync(startingRegcode, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodesModel} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.createAsync(startingRegcode, language, speciality, description, numberOfPaidSamples, trx)
        );
    }

    createManyRegcodeAsync(count, startingRegcode, language, speciality, description, numberOfPaidSamples, trx) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.createManyRegcodeAsync(count, startingRegcode, language, speciality, description, numberOfPaidSamples, trx)
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
