const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');

const FsUtils = require('./utils/FileSystemUtils');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');
const addModel = require('./20161006164624_add-compound-heterozygous-model').addModel;

const fieldsTableNames = {
    Metadata: 'field_metadata',
    Text: 'field_text'
};

const modelDir = '20161019142753_add-new-models';
const defaultsDir = path.join(__dirname, modelDir);

function addNewModels(knex, defaultsDir) {
    return getFieldsMetadata(knex)
        .then((fieldsMetadata) => addNewModelsToDatabase(knex, defaultsDir, fieldsMetadata));
}

function addNewModelsToDatabase(knex, defaultsDir, fieldsMetadata) {
    return Promise.fromCallback((callback) => FsUtils.getAllFiles(defaultsDir, '.json', callback))
        .mapSeries((file)=>createModelFromFile(knex, file, fieldsMetadata));
}

function getFieldsMetadata(knex) {
    return knex.select()
        .from(fieldsTableNames.Metadata);
}

function createModelRules(rules, fieldsMetadata) {
    return _createServerRulesRecursively(rules, fieldsMetadata);
}

function _findField(name, valueType, dimension, fieldsMetadata) {
    return _.find(fieldsMetadata, {name, value_type: valueType, dimension})
}

function _createServerRulesRecursively(filterRulesObject, fieldsMetadata) {
    const operator = filterRulesObject.condition || null;

    if (operator) {
        const operands = filterRulesObject.rules;
        const mappedOperands = _(operands)
            .map((operand) => _createServerRulesRecursively(operand, fieldsMetadata))
            .filter(operand => operand)
            .value();
        if (_.isEmpty(mappedOperands)) {
            return null;
        }
        return {
            condition: operator,
            rules: mappedOperands
        };
    } else {
        const {field:fieldDescriptor, sampleType, operator, value} = filterRulesObject;
        const {name, valueType, dimension} = fieldDescriptor;
        const field = _findField(name, valueType, dimension, fieldsMetadata);
        if (!field) {
            throw new Error(`Field is not found: ${name}, valueType: ${valueType}, dimension:  ${dimension}`);
        }
        return {
            field: field.id,
            sampleType,
            operator,
            value
        };
    }
}

function createModelFromFile(knex, metadataFilePath, fieldsMetadata) {
    const modelString = FsUtils.getFileContentsAsString(metadataFilePath);
    const model = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(modelString));
    const wsRules = createModelRules(model.rules, fieldsMetadata);
    const modelWithFieldIdsRule = Object.assign({}, model, {
        rules: wsRules
    });
    return addModel(knex, modelWithFieldIdsRule);
}

exports.up = function (knex) {
    console.log('Adding new default models');
    return addNewModels(knex, defaultsDir);
};

exports.down = function (knex, Promise) {
    throw new Error('Not implemented');
};

exports.addNewModels = addNewModels;