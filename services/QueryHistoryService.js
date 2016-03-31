'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class QueryHistoryService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.queryHistory);
    }

    add(user, languageId, query, callback) {
        super.add(user, languageId, query, callback)
    }
}

module.exports = QueryHistoryService;