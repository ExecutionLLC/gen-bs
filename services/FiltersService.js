'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class FiltersService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.filters);
    }

    add(user, languId, filter, callback) {
        async.waterfall([
            (callback) => this._checkFilterRules(filter.rules, callback),
            (callback) => {
                super.add(user, languId, filter, callback);
            }
        ], callback);
    }

    update(user, filter, callback) {
        async.waterfall([
            (callback) => this._checkFilterRules(filter.rules, callback),
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

    _checkFilterRules(filterRulesObject, callback) {
        this._createFilterRulesRecursively(filterRulesObject, (error) => {
            callback(error);
        });
    }

    _createFilterRulesRecursively(filterRulesObject, callback) {
        const operator = filterRulesObject['$and'] ? '$and' :
            filterRulesObject['$or'] ? '$or' : null;
        if (operator) {
            const operands = filterRulesObject[operator];
            const mappedOperands = _.map(operands, (operand) => this._createFilterRulesRecursively(operand, callback));
            const result = {};
            result[operator] = mappedOperands;
            callback(null, result);
        } else {
            const mappedColumns = _(filterRulesObject)
                .keys()
                .map(fieldId => {
                    const condition = filterRulesObject[fieldId];
                    return {
                        condition
                    };
                })
                .value();
            if (mappedColumns.length != 1) {
                callback(new Error('Unexpected filter format: there should be only one field condition per object.'));
            } else {
                callback(null, mappedColumns[0]);
            }
        }
    }
}

module.exports = FiltersService;
