const _ = require('lodash');
const Uuid = require('node-uuid');
const BluebirdPromise = require('bluebird');

const ChangeCaseUtil = require('./utils/ChangeCaseUtil');

const tables = {
    ModelVersion: 'model_version',
    Model: 'model',
    ModelText: 'model_text',
    Analysis: 'analysis'
};

exports.up = function (knex) {
    console.log('=> Update models schema...');
    return createModelVersionsTable(knex)
        .then(() => appendAnalysesFieldModelVersion(knex))
        .then(() => findModels(knex))
        .then((models) => {
            return BluebirdPromise.mapSeries(models, model => addModels(model, knex))
                .then(() => deleteRemovedModels(models, knex));
        })
        .then(() => removeAnalysesModelRef(knex))
        .then(() => deleteVersionsFromModelTable(knex))
        .then(() => removeOldModelsColumns(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function deleteRemovedModels(models, knex) {
    const deletedModels = _.filter(models, model => model.isDeleted && !_.isNull(model.originalModelId));
    return BluebirdPromise.mapSeries(deletedModels, model => deleteModel(model, knex));
}

function deleteModel(model, knex) {
    const {originalModelId, isDeleted} = model;
    return knex(tables.Model)
        .where('id', originalModelId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            isDeleted
        }));
}

function addModels(model, knex) {
    const {id, originalModelId, rules, timestamp} = model;
    const modelVersion = {
        modelId: originalModelId || id,
        rules,
        created: timestamp
    };
    return addModelVersion(modelVersion, knex)
        .then((modelVersionId) => updateAnalyses(id, modelVersionId, knex));
}

function updateAnalyses(modelId, modelVersionId, knex) {
    return knex(tables.Analysis)
        .where('model_id', modelId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            modelVersionId
        }));
}

function createModelVersionsTable(knex) {
    return knex.schema.createTable(tables.ModelVersion, (table) => {
        table.uuid('id')
            .primary();
        table.uuid('model_id')
            .notNullable()
            .references('id')
            .inTable(tables.Model);
        table.json('rules');
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
}

function appendAnalysesFieldModelVersion(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.uuid('model_version_id')
            .references('id')
            .inTable(tables.ModelVersion);
    });
}

function removeAnalysesModelRef(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.dropColumn('model_id');
    })
}

function removeOldModelsColumns(knex) {
    return knex.schema.table(tables.Model, (table) => {
        table.dropColumn('original_model_id');
        table.dropColumn('rules');
    })
}

function deleteVersionsFromModelTable(knex) {
    return findModels(knex)
        .then((models) => {
            const deletingModels = _.filter(models, model => !_.isNull(model.originalModelId));
            const deleteModelsIds = _.map(deletingModels, model => model.id);
            return knex(tables.ModelText)
                .whereIn('model_id', deleteModelsIds)
                .del()
                .then(() => knex(tables.Model)
                    .whereNotNull('original_model_id')
                    .del()
                );
        })
}

function findModels(knex) {
    return knex.select()
        .from(tables.Model)
        .orderBy('timestamp', 'asc')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function addModelVersion(modelVersion, knex) {
    const {id, modelId, rules, created} = modelVersion;
    const newId = id || Uuid.v4();
    return knex(tables.ModelVersion)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            modelId,
            rules,
            created,
            id: newId
        }))
        .then(() => newId);
}