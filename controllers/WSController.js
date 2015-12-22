'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class WSController extends ControllerBase {
    constructor(services) {
        super(services);

    }

    createRouter() {
        const router = new Express();

        return router;
    }
}

module.exports = WSController;