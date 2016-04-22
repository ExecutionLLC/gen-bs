'use strict';

const ServiceBase = require('./ServiceBase');

class KeywordService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    add(keyword, callback) {
        this.models.keywords.add(keyword, callback);
    }

    findForFieldIds(fieldIds, callback) {
        this.models.keywords.findForFieldIds(fieldIds, callback);
    }

    findMany(keywordIds, callback) {
        this.models.findMany(keywordIds, callback);
    }
}

module.exports = KeywordService;
