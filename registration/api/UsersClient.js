'use strict';

const Request = require('superagent');

const ADD_USER_KEY = 'b5b7a458-693c-4a8d-845b-7b9a1295a15b';

class UsersClient {
    constructor(config) {
        this.urlAdd = `${config.usersClient.httpScheme}://${config.usersClient.host}:${config.usersClient.port}/api${'/users'}`;
    }

    addAsync(languId, user) {
        return new Promise((resolve, reject) => {
            Request
                .post(this.urlAdd)
                .send({key: ADD_USER_KEY, languId, user})
                .then(({body}) => resolve(body))
                .catch((error) => reject(error));
        });
    }
}

module.exports = UsersClient;