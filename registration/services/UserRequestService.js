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
        const {db, userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.createAsync(userInfo, trx));
    }
}

module.exports = UserRequestService;
