'use strict';

const Request = require('superagent');

class UsersClient {
    constructor(config) {
        this.urlAdd = `${config.usersClient.httpScheme}://${config.usersClient.host}:${config.usersClient.port}/api${'/users'}`;
    }

    addAsync(user) {
        return new Promise((resolve, reject) => {
            Request
                .post(this.urlAdd)
                .send(user)
                .then(({body}) => resolve(body))
                .catch((error) => reject(error.response.body));
        });
    }
}

module.exports = UsersClient;