'use strict';

const async = require('async');

const AppServerFilterUtils = require('../utils/AppServerFilterUtils');
const UserEntityServiceBase = require('./UserEntityServiceBase');

class FiltersService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.filters);
    }

    add(user, languId, item, callback) {
        super.add(user, languId, item, callback);
    }

    update(user, filter, callback) {
        async.waterfall([
            (callback) => super.find(user, filter.id, callback),
            (existingFilter, callback) => {
                if (existingFilter.type !== 'user') {
                    callback(new Error('Default filter cannot be updated'));
                } else {
                    super.update(user, filter, callback);
                }
            }
        ], callback);
    }
}

module.exports = FiltersService;
