'use strict';

const ServiceBase = require('./ServiceBase');

class LanguageService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    findDefaultLangu(callback) {
        const defaultLanguageId = this.models.config.defaultLanguId;
        this.find(defaultLanguageId, callback);
    }

    find(languageId, callback) {
        this.models.language.find(languageId, callback);
    }

    findAll(callback) {
        this.models.language.findAll(callback);
    }

    exists(languageId, callback) {
        this.models.language.exists(languageId, callback);
    }
}

module.exports = LanguageService;