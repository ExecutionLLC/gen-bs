'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

const modelObjectKeys = ['field', 'operator', 'value', 'sampleType'];

class ModelsService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.models);
    }

    add(user, languageId, model, callback) {
        async.waterfall([
            (callback) => {
                this._checkModelRules(model, callback);
            },
            (callback) => super.findAll(user, callback),
            (models, callback) => {
                this._checkModelNameExists(model, models, callback)
            },
            (callback) => super.add(user, languageId, model, callback)
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
        if (model.modelType == 'filter') {
            this._checkFilterRules(model.rules, callback)
        } else if (model.modelType == 'complex') {
            this._checkComplexRules(model.rules, callback)
        }
    }

    _checkFilterRules(rules, callback) {
        async.waterfall([
            (callback) => {
                if (!_.isObject(rules)) {
                    callback(new Error('Model rules are not in correct format'))
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this._checkModelFilterRulesRecursively(rules, (error) => {
                    callback(error);
                });
            }
        ], callback);
    }

    _checkModelFilterRulesRecursively(modelRulesObject, callback) {
        const operator = modelRulesObject['condition'] || null;
        if (operator) {
            const operands = modelRulesObject['rules'];
            const mappedOperands = _.map(operands, (operand) => this._checkModelFilterRulesRecursively(operand, callback));
            const result = {};
            result[operator] = mappedOperands;
            callback(null, result);
        } else {
            const mappedColumnKeys = _.keys(modelRulesObject);

            const columnDifference = _.difference(modelObjectKeys, mappedColumnKeys);
            if (columnDifference.length != 0) {
                callback(new Error(`Unexpected model format: there should all fields : ${columnDifference}`));
            } else {
                callback(null, modelRulesObject);
            }
        }
    }

    _checkComplexRules(rules, callback) {
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
            models, f => f.name.trim() === modelName && model.analysisType === f.analysisType
        );
        if (modelExists) {
            callback(new Error('Model with this name already exists.'));
        } else {
            callback(null);
        }
    }
}

module.exports = ModelsService;