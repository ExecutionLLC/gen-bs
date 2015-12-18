'use strict';

const Express = require('express');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class TestController {
    constructor(services) {
        this.services = services;

        this.test = this.test.bind(this);
    }

    sendInternalError(response, message) {
        this.sendError(response, 500, message);
    }

    sendError(response, httpError, message) {
        response
            .status(httpError)
            .json({
                code: httpError,
                message
            })
            .end();
    }

    sendJson(response, obj) {
        const snakeCasedObj = ChangeCaseUtil.convertKeysToSnakeCase(obj);
        response
            .json(snakeCasedObj)
            .end();
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