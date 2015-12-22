'use strict';

const UserEntityControllerBase = require('./UserEntityControllerBase');

class FilterController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.filters);
    }
}

module.exports = FilterController;