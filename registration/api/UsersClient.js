'use strict';

const Request = require('superagent');

const ADD_USER_KEY = 'b5b7a458-693c-4a8d-845b-7b9a1295a15b';

class UsersClient {
    constructor(config) {
        this.urlAdd = `${config.usersClient.httpScheme}://${config.usersClient.host}:${config.usersClient.port}/api${'/users'}`;
        this.ADD_USER_KEY = config.usersClient.ADD_USER_KEY;
    }

    addAsync(user) {
        return new Promise((resolve, reject) => {
            Request
                .post(this.urlAdd)
                .send({
                    key: this.ADD_USER_KEY,
                    languId: 'en',
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        speciality: user.speciality,
                        numberPaidSamples: user.numberOfPaidSamples,
                        gender: user.gender,
                        phone: user.telephone,
                        loginType: user.loginType,
                        password: user.password,
                        company: user.company
                    }
                })
                .then(({body}) => resolve(body))
                .catch((error) => reject(error.response.body));
        });
    }
}

module.exports = UsersClient;