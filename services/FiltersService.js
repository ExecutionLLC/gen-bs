'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class FiltersService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.filters);
    }

    update(user, filter, callback) {
        if (filter.type !== 'user') {
            callback(new Error('Default filter cannot be updated'));
        } else {
            super.update(user, filter, callback);
        }
    }
}

module.exports = FiltersService;
