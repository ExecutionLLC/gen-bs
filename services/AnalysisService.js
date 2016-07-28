'use strict';

const async = require('async');
const _ = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class AnalysisService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.analysis);
    }

    findAll(user, limit, offset, callback) {
        callback(null, null)
    }

    add(user, languageId, sampleId, viewId, filterId, callback) {
        callback(null, null)
    }

    update(user, item, callback) {
        callback(null, null)
    }
}

module.exports = AnalysisService;