'use strict';


const NUMBER_OF_PAID_SAMPLES = 10;

class UserRequestService {
    constructor(db, userRequestModel, usersClient) {
        this.db = db;
        this.userRequestModel = userRequestModel;
        this.usersClient = usersClient;
    }

    activateAsync(registrationCodeId) {
        const {db, userRequestModel, usersClient} = this;

        return db.transactionallyAsync((trx) =>
            userRequestModel.findInactiveAsync(registrationCodeId, trx)
                .then((user) => {
                    const userWithPaidSamples = Object.assign({}, user, {numberOfPaidSamples: NUMBER_OF_PAID_SAMPLES});
                    return usersClient.addAsync(userWithPaidSamples)
                        .then(() => userWithPaidSamples);
                })
                .then((userWithPaidSamples) =>
                    userRequestModel.activateAsync(registrationCodeId, trx)
                        .then(() => userWithPaidSamples)
                )
        );
    }

    createAsync(userInfo) {
        const {db, /**@type {UserRequestModel}*/userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.createAsync(userInfo, trx));
    }

    emailConfirmSentAsync(id) {
        const {db, /**@type {UserRequestModel}*/userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.emailConfirmSentAsync(id, trx)
        );
    }

    emailConfirmReceivedAsync(confirmUUID) {
        const {db, /**@type {UserRequestModel}*/userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.emailConfirmReceivedAsync(confirmUUID, trx)
        );
    }

    getAllRequestsAsync() {
        const {db, userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.getAllRequestsAsync(trx));
    }
}

module.exports = UserRequestService;
