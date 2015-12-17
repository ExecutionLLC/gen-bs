'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

const FILTERS = require('../test_data/filters.json');

class FilterController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getFilters = this.getFilters.bind(this);
    }

    getFilters(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        this.sendJson(response, FILTERS);
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.getFilters);

        return router;
    }
}

module.exports = FilterController;