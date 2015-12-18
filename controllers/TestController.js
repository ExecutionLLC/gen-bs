'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class TestController extends ControllerBase {
    constructor(services) {
        super(services);

        this.test = this.test.bind(this);
    }

    test(request, response) {
        this.services.applicationServer.test((error, result) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, result);
            }
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.test);
        return router;
    }
}

module.exports = TestController;