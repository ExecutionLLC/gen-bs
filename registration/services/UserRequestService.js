'use strict';


const NUMBER_OF_PAID_SAMPLES = 10;

class UserRequestService {
    constructor(db, userRequestModel, usersClient) {
        this.db = db;
        this.userRequestModel = userRequestModel;
        this.usersClient = usersClient;
    }

    activateAsync(registrationCodeId, firstName, lastName, userEmail) {
        const {db, userRequestModel, usersClient} = this;

        return db.transactionallyAsync((trx) =>
            userRequestModel.findInactiveAsync(registrationCodeId, trx)
                .then(({speciality}) =>
                    usersClient.addAsync({firstName, lastName, userEmail, speciality, numberOfPaidSamples: NUMBER_OF_PAID_SAMPLES})
                )
                .then(() => userRequestModel.activateAsync(registrationCodeId, userEmail, trx))
        );
    }

    createAsync(userInfo) {
        const {db, userRequestModel} = this;
        return db.transactionallyAsync((trx) =>
            userRequestModel.createAsync(userInfo, trx));
    }
}

module.exports = UserRequestService;
