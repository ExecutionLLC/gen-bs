'use strict';

const ServiceBase = require('./ServiceBase');

class LanguService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    findDefaultLangu(callback) {
        const defaultLanguId = this.models.config.defaultLanguId;
        this.find(defaultLanguId, callback);
    }

    find(languId, callback) {
        this.models.langu.find(languId, callback);
    }

    findAll(callback) {
        this.models.langu.findAll(callback);
    }
}

module.exports = LanguService;