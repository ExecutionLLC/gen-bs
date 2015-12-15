'use strict';

const ServiceBase = require('./ServiceBase');

const FILTERS = require('../test_data/filters.json');

class FiltersService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    findByUser(user, callback) {
        if (!user) {
            callback(new Error('User undefined'));
        } else {
            callback(null, FILTERS);
        }
    }
}

module.exports = FiltersService;
