'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil.js');

class ModelsBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        this.modelTemplates = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.defaultsDir + '/templates/model-templates.json')
        );

        this.build = this.build.bind(this);
        this._storeModels = this._storeModels.bind(this);
        this._createModel = this._createModel.bind(this);
        this._createRules = this._createRules.bind(this);
        this._processRulesRecursively = this._processRulesRecursively.bind(this);
    }

    build(callback) {
        const fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.fieldMetadataFile)
        );

        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.modelsDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.modelsDir, callback);
            },
            (callback) => {
                const models = _.map(this.modelTemplates, (model) => this._createModel(model, fieldsMetadata));
                this._storeModels(models, callback);
            }
        ], callback);
    }

    _storeModels(models, callback) {
        const json = JSON.stringify(models, null, 2);
        const modelsFile = this.modelsDir + '/default-models.json';
        FsUtils.writeStringToFile(modelsFile, json, callback);
    }

    _createModel(modelTemplate, fieldsMetadata) {
        const rules = this._createRules(modelTemplate.rules, fieldsMetadata);
        return {
            id: Uuid.v4(),
            name: modelTemplate.name,
            description: modelTemplate.description,
            type: modelTemplate.type,
            modelType: modelTemplate.modelType,
            analysisType: modelTemplate.analysisType,
            rules
        };
    }

    _createRules(rulesTemplate, fieldsMetadata) {
        if(rulesTemplate === null) {
            return null
        }
        return this._processRulesRecursively(rulesTemplate, fieldsMetadata);
    }

    _processRulesRecursively(rulesObject, fieldsMetadata) {
        const operator = rulesObject['$and'] ?
            '$and' : (
            rulesObject['$or'] ? '$or' : null
        );

        if (operator) {
            const operands = rulesObject[operator];
            const mappedOperands = _.map(operands, (operand) => this._processRulesRecursively(operand, fieldsMetadata));
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            const fieldDescriptor = rulesObject.field;
            const field = this._findField(fieldDescriptor.name, fieldDescriptor.sourceName, fieldDescriptor.valueType, fieldsMetadata);
            if (!field) {
                throw new Error('Field is not found: ' + fieldDescriptor.name + ', source: ' + fieldDescriptor.sourceName + ', type: ' + fieldDescriptor.valueType);
            }

            const condition = rulesObject.condition;
            const result = {};
            result[field.id] = condition;
            return result;
        }
    }
}

module.exports = new ModelsBuilder();