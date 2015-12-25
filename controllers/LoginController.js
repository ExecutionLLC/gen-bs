'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class LoginController extends ControllerBase {
    constructor(services) {
        super(services);

        this.login = this.login.bind(this);
        this.checkToken = this.checkToken.bind(this);
    }

    login(request, response) {
        const body = this.getRequestBody(request);
        const userName = body.userName;
        const password = body.password;
        this.services.users.login(userName, password, (error, token) => {
            this.sendJson(response, {
                token: token
            });
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.login);
        router.post('/', this.checkToken);

        return router;
    }
}

module.exports = LoginController;