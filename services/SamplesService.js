'use strict';

const lodash = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SamplesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.samples);
    }
}

module.exports = SamplesService;
