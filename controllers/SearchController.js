'use strict';

const Express = require('express');

class SearchController {
    constructor(services) {
        this.services = services;

    }

    createRouter() {
        const router = new Express();

        return router;
    }
}

module.exports = SearchController;