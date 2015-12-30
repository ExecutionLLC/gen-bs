'use strict';

const UserEntityControllerBase = require('./UserEntityControllerBase');

class SampleController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.samples);
    }
}

module.exports = SampleController;