'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ModelsService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.models);
    }
}

module.exports = ModelsService;