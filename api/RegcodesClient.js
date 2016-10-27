'use strict';

const Request = require('superagent');

class RegcodesClient {
    constructor(config) {
        this.activateUrl = `${config.regserver.SCHEME}://${config.regserver.HOST}:${config.regserver.PORT}/register`;
    }

    activateAsync(registrationCodeId) {
        return new Promise((resolve, reject) => {
            Request
                .post(this.activateUrl)
                .send(registrationCodeId)
                .then((res) => resolve(res.body))
                .catch((error) => reject(error));
        });
    }
}

module.exports = RegcodesClient;