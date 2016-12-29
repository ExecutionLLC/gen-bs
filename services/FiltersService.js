'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

const filterObjectKeys = ['field', 'operator', 'value'];

class FiltersService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.filters);
    }

    add(user, languageId, filter, callback) {
        async.waterfall([
            (callback) => this._checkFilterRules(filter, callback),
            (callback) => super.findAll(user, callback),
            (filters, callback) => {
                this._checkFilterNameExists(filter, filters, callback)
            },
            (callback) => super.add(user, languageId, filter, callback)
        ], callback);
    }

    update(user, filter, callback) {
        async.waterfall([
            (callback) => this._checkFilterRules(filter, callback),
            (callback) => super.find(user, filter.id, callback),
            (existingFilter, callback) => this._ensureItemOfUserType(existingFilter, callback),
            (existingFilter, callback) => super.update(user, filter, callback)
        ], callback);
    }

    remove(user, filterId, callback) {
        async.waterfall([
            (callback) => super.find(user, filterId, callback),
            (existingFilter, callback) => this._ensureItemOfUserType(existingFilter, callback),
            (existingFilter, callback) => super.remove(user, existingFilter.id, callback)
        ], (error, filter) => {
            callback(error, filter);
        });
    }

    _checkFilterRules(filter, callback) {
        async.waterfall([
            (callback) => {
                if (!_.isObject(filter.rules)) {
                    callback(new Error('Filter rules are not in correct format'))
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this._checkFilterRulesRecursively(filter.rules, (error) => {
                    callback(error);
                });
            }
        ], callback);
    }

    _checkFilterRulesRecursively(filterRulesObject, callback) {
        const operator = filterRulesObject['condition'] || null;
        if (operator) {
            const operands = filterRulesObject['rules'];
            const mappedOperands = _.map(operands, (operand) => this._checkFilterRulesRecursively(operand, callback));
            callback (null, {
                [operator]: mappedOperands
            })
        } else {
            const mappedColumnKeys = _.keys(filterRulesObject);
            if (_.difference(filterObjectKeys, mappedColumnKeys).length != 0) {
                callback(new Error(`Unexpected filter format: there should all fields from : ${filterObjectKeys}`));
            } else {
                callback(null, filterRulesObject);
            }
        }
    }

    _checkFilterNameExists(filter, filters, callback) {
        if (!_.isString(filter.name)) {
            callback(new Error('Filter name should be a string.'));
            return;
        }
        const filterName = filter.name.trim();
        const filterExists = _.some(
            filters, f => f.name.trim() == filterName
        );
        if (filterExists) {
            callback(new Error('Filter with this name already exists.'));
        } else {
            callback(null);
        }
    }
}

module.exports = FiltersService;
