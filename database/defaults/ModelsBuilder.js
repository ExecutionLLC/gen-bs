'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const ChangeCaseUtil = require('../scripts/utils/ChangeCaseUtil.js');

class ModelsBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        this.modelTemplates = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.defaultsDir + '/templates/model-templates.json')
        );
    }

    getModels() {
        const fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.fieldMetadataFile)
        );

        return _.map(this.modelTemplates, (model) => this._createModel(model, fieldsMetadata));
    }

    _createModel(modelTemplate, fieldsMetadata) {
        const {name, description, type, modelType, analysisType, rules} = modelTemplate;
        const createdRules = this._createRules(rules, fieldsMetadata);
        return {
            id: Uuid.v4(),
            name: name,
            description: description,
            type: type,
            modelType: modelType,
            analysisType: analysisType,
            rules: createdRules
        };
    }

    _createRules(rulesTemplate, fieldsMetadata) {
        if (!rulesTemplate) {
            return null;
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
            result['condition'] = operator;
            result['rules'] = mappedOperands;
            return result;
        } else {
            const {field:fieldDescriptor, condition:{operator, value}} = rulesObject;
            const {name: fieldName, sourceName, valueType, sampleType} = fieldDescriptor;
            const field = this._findField(fieldName, sourceName, valueType, fieldsMetadata);
            if (!field) {
                throw new Error('Field is not found: ' + fieldDescriptor.name + ', source: ' + fieldDescriptor.sourceName + ', type: ' + valueType);
            }
            const result = {};
            return {
                field: field.id,
                sampleType,
                operator,
                value
            };
        }
    }
}

module.exports = new ModelsBuilder();