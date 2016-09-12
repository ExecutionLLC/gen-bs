'use strict';

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class ModelController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.models);
    }
}

module.exports = ModelController;