const Uuid = require('node-uuid');

const Config = require('./utils/Config');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');

const modelTables = {
    METADATA: 'model',
    TEXT: 'model_text'
};

function removeEmptyRulesModels(knex, Promise) {
    console.log('==> Deleting old default complex models...');
    return knex(modelTables.METADATA)
        .whereNull('rules')
        .update({
            is_deleted: true
        });
}

function addCompoundHeterozygousModel(knex, Promise) {
    const model = {
        name: 'Compound Heterozygous',
        description: '',
        type: 'standard',
        analysisType: 'family',
        modelType: 'complex',
        rules: {
            name: 'CompoundHeterozygousModel'
        }
    };
    return addModel(knex,model);
}

function addModel(knex, model) {
    const {
        creator, rules, type, analysisType, modelType, name, description, languId
    } = model;
    const id = Uuid.v4();
    return knex(modelTables.METADATA)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            id,
            creator,
            rules,
            type,
            analysisType,
            modelType
        })).then((response) => {
            return knex(modelTables.TEXT)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                    modelId: id,
                    name,
                    description,
                    languId: languId || Config.defaultLanguId
                }))
        });
}

exports.up = function (knex, Promise) {
    console.log('=> Add Compound Heterozygous model...');
    return addCompoundHeterozygousModel(knex, Promise)
        .then(() => removeEmptyRulesModels(knex, Promise))
        .then(() => console.log('=> Complete.'));
};

exports.down = function () {
    throw new Error('Not implemented');
};

exports.addModel = addModel;
