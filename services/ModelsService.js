'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ModelsService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.models);
    }

    add(user, languId, model, callback) {
        async.waterfall([
            (callback) => {
                this._checkModelRules(model, callback);
            },
            (callback) => super.findAll(user, callback),
            (models, callback) => {
                this._checkModelNameExists(model, models, callback)
            },
            (callback) => super.add(user, languId, model, callback)
        ], callback);
    }

    update(user, model, callback) {
        async.waterfall([
            (callback) => this._checkModelRules(model, callback),
            (callback) => super.find(user, model.id, callback),
            (existingModel, callback) => this._ensureItemOfUserType(existingModel, callback),
            (existingModel, callback) => super.update(user, model, callback)
        ], callback);
    }

    remove(user, modelId, callback) {
        async.waterfall([
            (callback) => super.find(user, modelId, callback),
            (existingModel, callback) => this._ensureItemOfUserType(existingModel, callback),
            (existingModel, callback) => super.remove(user, existingModel.id, callback)
        ], (error, model) => {
            callback(error, model);
        });
    }

    _checkModelRules(model, callback) {
        if (model.modelType == 'filter'){
            this._checkFilterRules(model.rules, callback)
        }else if (model.modelType == 'complex'){
            this._checkComplexRules(model.rules, callback)
        }
    }

    _checkFilterRules(rules, callback) {
        async.waterfall([
            (callback) => {
                if (!_.isObject(rules)) {
                    callback(new Error('Filter rules are not in correct format'))
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this._checkFilterRulesRecursively(rules, (error) => {
                    callback(error);
                });
            }
        ], callback);
    }

    _checkFilterRulesRecursively(filterRulesObject, callback) {
        const operator = filterRulesObject['$and'] ? '$and' :
            filterRulesObject['$or'] ? '$or' : null;
        if (operator) {
            const operands = filterRulesObject[operator];
            const mappedOperands = _.map(operands, (operand) => this._checkFilterRulesRecursively(operand, callback));
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

    _checkComplexRules(rules, callback){
        //TODO: add some check for complex rules
        callback(null)
    }

    _checkModelNameExists(model, models, callback) {
        if (!_.isString(model.name)) {
            callback(new Error('Model name should be a string.'));
            return;
        }
        const modelName = model.name.trim();
        const modelExists = _.some(
            models, f => f.name.trim() == modelName
        );
        if (modelExists) {
            callback(new Error('Model with this name already exists.'));
        } else {
            callback(null);
        }
    }
}

module.exports = ModelsService;