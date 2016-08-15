'use strict';

const path = require('path');

const FsUtils = require('../../utils/FileSystemUtils');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');
const Uuid = require('node-uuid');
const ModelsBuilder = require('../defaults/ModelsBuilder');

const entityTypeEnumValues = [
    'standard', // Available for demo user
    'advanced', // Shown in demo, but locked. Available for registered users.
    'user' // Created by user.
];

// Possible values for model types.
const modelTypeEnumValues = [
    'filter', // Model is similar to filter.
    'complex' // Model has a defined behavior and is not cloneable/editable.
];

const modelAnalysisTypeEnumValues = [
    'all',      // Model should be available in all lists.
    'tumor',    // Tumor/Normal analysis-only models.
    'family'    // Family analysis-only models.
];


const analysesTypeEnumValues = [
    'single',
    'tumor',
    'family'
];

const analysesSampleTypeEnumValues = [
    'single',
    'proband',
    'mother',
    'father',
    'tumor',
    'normal'
];


function createAnalysisTables(knex, Promise) {
    console.log('=> Creating analysis-ralated tables...');
    const {schema} = knex;
    return schema
        .createTableIfNotExists('model', (table) => {
            table.uuid('id')
                .primary();
            table.uuid('original_model_id')
                .references('id')
                .inTable('model');
            table.json('rules')
                .nullable();
            table.enu('type', entityTypeEnumValues)
                .notNullable();
            table.enu('model_type', modelTypeEnumValues)
                .notNullable();
            table.enu('analysis_type', modelAnalysisTypeEnumValues)
                .notNullable();
            table.boolean('is_deleted')
                .defaultTo(false);
            table.timestamp('timestamp')
                .defaultTo(knex.fn.now());
            table.uuid('creator')
                .references('id')
                .inTable('user');
        })
        .createTableIfNotExists('model_text', table => {
            table.uuid('model_id')
                .references('id')
                .inTable('model');
            table.string('langu_id', 2)
                .references('id')
                .inTable('langu');
            table.string('name', 50)
                .notNullable();
            table.string('description', 512);

            table.primary(['model_id', 'langu_id']);
        })

        .createTableIfNotExists('analysis', table => {
            table.uuid('id')
                .primary();
            table.enu('type', analysesTypeEnumValues)
                .notNullable();
            table.uuid('view_id')
                .references('id')
                .inTable('view')
                .notNullable();
            table.uuid('filter_id')
                .references('id')
                .inTable('filter')
                .notNullable();
            table.uuid('model_id');
            table.timestamp('timestamp')
                .defaultTo(knex.fn.now());
            table.timestamp('last_query_date')
                .defaultTo(knex.fn.now());
            table.uuid('creator')
                .references('id')
                .inTable('user')
                .notNullable();
        })
        .createTableIfNotExists('analysis_text', table => {
            table.uuid('analysis_id')
                .references('id')
                .inTable('analysis');
            table.string('langu_id', 2)
                .references('id')
                .inTable('langu');
            table.string('name', 50);
            table.text('description');

            table.primary(['analysis_id', 'langu_id']);
        })
        .createTableIfNotExists('analysis_sample', table => {
            table.uuid('analysis_id')
                .references('id')
                .inTable('analysis')
                .notNullable();
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version')
                .notNullable();
            table.enu('sample_type', analysesSampleTypeEnumValues)
                .notNullable();
            table.integer('order')
                .notNullable();
        })
}

function importDefaultModels(knex, Promise) {
    const models = ModelsBuilder.getModels();

    return Promise.all(
        models.map(
            (model) => {

                const {creator, rules, type, analysisType, modelType, name, description, languId} = model;
                const id = Uuid.v4();
                console.log(model);
                return knex('model')
                    .insert(
                        ChangeCaseUtil.convertKeysToSnakeCase(
                            {
                                id,
                                creator,
                                rules,
                                type,
                                analysisType,
                                modelType
                            }
                        )
                    )
                    .then(
                        function (response) {
                            console.log(response);
                            return knex('model_text')
                                .insert(
                                    ChangeCaseUtil.convertKeysToSnakeCase(
                                        {
                                            modelId: id,
                                            name,
                                            description,
                                            languId:languId||"en"
                                        }
                                    )
                                )
                    });
            }
        )
    );
}

exports.up = function (knex, Promise) {
    return createAnalysisTables(knex, Promise)
        .then(() => importDefaultModels(knex, Promise))
        .then(() => console.log('=> Complete.'));
};

exports.down = function (knex, Promise) {

};