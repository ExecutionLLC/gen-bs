'use strict';

const Express = require('express');

class FilterController {
    constructor(services) {
        this.services = services;
    }

    createRouter() {
        const router = new Express();

        return router;
    }
}

module.exports = FilterController;