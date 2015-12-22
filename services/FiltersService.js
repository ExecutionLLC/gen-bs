'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class FiltersService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.filters);
    }
}

module.exports = FiltersService;
