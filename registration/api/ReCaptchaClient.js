'use strict';

const Request = require('superagent');

class ReCaptchaClient {
    constructor(config) {
        this.SECRET = config.reCaptcha.SECRET;
        this.urlAdd = `${config.usersClient.httpScheme}://${config.usersClient.host}:${config.usersClient.port}/api${'/users'}`;
    }

    checkAsync(reCaptchaResponse) {
        return new Promise((resolve, reject) => {
            Request
                .post('https://www.google.com/recaptcha/api/siteverify')
                .type('form')
                .accept('json')
                .send({secret: this.SECRET, response: reCaptchaResponse})
                .then(({body}) => resolve(body))
                .catch((error) => reject(error.response.body));
        });
    }
}

module.exports = ReCaptchaClient;