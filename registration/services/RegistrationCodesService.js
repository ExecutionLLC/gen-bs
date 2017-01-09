'use strict';

class RegistrationCodesService {
    /**@typedef {Object} RegistrationCodesService
     * @property {KnexWrapper} db
     * @property {RegistrationCodesModel} registrationCodesModel
     * @property {UsersClient|MockUsersClient} usersClient
     **/

    constructor(db, registrationCodesModel, usersClient) {
        Object.assign(this, {db, registrationCodesModel, usersClient});
    }

    activateAsync(user) {
        const {db, registrationCodesModel, usersClient} = this;

        return db.transactionallyAsync((trx) =>
            registrationCodesModel.activateAsync(user.id, trx)
                .then((userPay) => usersClient.addAsync(Object.assign({}, user, {numberOfPaidSamples: userPay.numberOfPaidSamples})))
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

    getAllRegcodesAsync() {
        const {db, registrationCodesModel} = this;
        return db.transactionallyAsync((trx) =>
            registrationCodesModel.getAllRegcodesAsync(trx));
    }
}

module.exports = RegistrationCodesService;
