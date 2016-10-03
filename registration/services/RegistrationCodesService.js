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

    activateAsync(user) {
        const {db, registrationCodesModel, usersClient} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.activateAsync(user, trx)
                .then(() => usersClient.addAsync(user))
        );
    }

    createRegcodeAsync(startingRegcode, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodesModel} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.createRegcodeAsync(startingRegcode, language, speciality, description, numberOfPaidSamples, trx)
        );
    }

    createManyRegcodeAsync(count, startingRegcode, language, speciality, description, numberOfPaidSamples) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.createManyRegcodeAsync(count, startingRegcode, language, speciality, description, numberOfPaidSamples, trx)
        );
    }

    findRegcodeAsync(regcode) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.findRegcodeAsync(regcode, trx)
        );
    }

    findRegcodeIdAsync(regcode) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.findRegcodeIdAsync(regcode, trx)
        );
    }

    update(regcodeId, regcodeInfo) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.update(regcodeId, regcodeInfo, trx));
    }

    updateFirstDate(regcodeId, regcodeInfo) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.updateFirstDate(regcodeId, regcodeInfo, trx));
    }

    updateLastDate(regcodeId, regcodeInfo) {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.updateLastDate(regcodeId, regcodeInfo, trx));
    }

}

module.exports = RegistrationCodesService;
