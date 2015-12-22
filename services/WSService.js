'use strict';

const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

class WSService extends ServiceBase {
    constructor(services) {
        super(services);
    }
}

module.exports = WSService;