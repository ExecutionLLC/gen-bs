'use strict';

// This script updates labels for existing fields in the database.
// Labels are loaded from templates/metadata/labels/*

const Knex = require('knex');
const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const assert = require('assert');
const {processRulesFile, isBlank} = require('./parse-fields-labels');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');
const Config = require('../../utils/Config');

const languages = ['en', 'ru'];

const sources = [
    {
        sourceName: 'clinvar_20160705_v01',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ClinVar.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ClinVar.json'
    },
    {
        sourceName: 'dbsnp_20160601_v01',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/dbSNP.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/dbSNP.json'
    },
    {
        sourceName: 'ESP6500_v01',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ESP6500.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ESP6500.json'
    },
    {
        sourceName: 'ExAC_r0_3_1_sites_v01',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ExAC.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ExAC.json'
    },
    {
        sourceName: 'one_thousand_genome_v01',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/1000genomes.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/1000genomes.json'
    },
    {
        sourceName: 'sample',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vcf.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vcf.json'
    },
    {
        sourceName: 'sample',
        inputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vep.txt',
        outputPath: '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vep.json'
    }
];


function hasTranslation(obj, language) {
    return obj[language] && (obj[language].label || obj[language].description);
}

function compareFields(fieldDb, fieldTxt, language) {

    if (!fieldTxt[language] || (!fieldTxt[language].label && !fieldTxt[language].description)) {
        console.log(`Warning: field ${JSON.stringify(fieldTxt)} doesn't contain translation for '${language}'`);
        return null;
    }

    let newLabel = '';
    let newDescription = '';
    if (isBlank(fieldTxt[language].label)) {
        console.log(`Warning: field ${JSON.stringify(fieldTxt)} contains empty label for '${language}'`);
    } else {
        newLabel = fieldTxt[language].label;
    }
    if (isBlank(fieldTxt[language].description)) {
        console.log(`Warning: field ${JSON.stringify(fieldTxt)} contains empty description for '${language}'`);
    } else {
        newDescription = fieldTxt[language].description;
    }

    let oldLabel = '';
    let oldDescription = '';
    if (fieldDb[language]) {
        if (!isBlank(fieldDb[language].label)) {
            oldLabel = fieldDb[language].label;
        }
        if (!isBlank(fieldDb[language].description)) {
            oldDescription = fieldDb[language].description;
        }
    }

    if (newLabel === oldLabel && newDescription === oldDescription) {
        return null;
    } else {
        let result = {};

        if (newLabel !== oldLabel) {
            result.newLabel = newLabel;
            result.oldLabel = oldLabel;
        }

        if (newDescription !== oldDescription) {
            result.newDescription = newDescription;
            result.oldDescription = oldDescription;
        }
        return result;
    }
}

async.waterfall([
    // 1. Parse txt files
    (callback) => {
        const fieldsParRules = _.map(sources, (item) => {
            return {
                inputPath: item.inputPath,
                fields: processRulesFile(item.inputPath, item.outputPath, item.sourceName)
            }
        });
        callback(null, {fieldsParRules});
    },
    // 2. Create and configure Knex, get fields from DB
    (context, callback) => {
        const databaseSettings = Config.database;
        const knex = new Knex({
            client: databaseSettings.client,
            connection: {
                host: databaseSettings.host,
                port: databaseSettings.port,
                user: databaseSettings.user,
                password: databaseSettings.password,
                database: databaseSettings.databaseName
            }
        });
        let query = knex.select('*').from('field').leftJoin('field_text', 'field.id', 'field_text.field_id');
        query.asCallback((error, fields) => callback(error, Object.assign({}, context, {fields})));
    },
    // 3. prepare fields from DB for comparing
    (context, callback) => {
        const {fields} = context;
        const fieldsProcessed = _.reduce(fields, (result, fieldRow) => {
            if (!fieldRow.language_id) {
                console.log(`Defaulting language from 'null' to 'en' for field: ${JSON.stringify(fieldRow)}`);
                fieldRow.language_id = 'en';
            }
            if (result) {
                if (!(fieldRow.id in result)) {
                    result[fieldRow.id] = {
                        id: fieldRow.id,
                        name: fieldRow.name,
                        source_name: fieldRow.source_name,
                        value_type: fieldRow.value_type,
                        dimension: fieldRow.dimension,
                    };
                }
                if (!(fieldRow.language_id in result[fieldRow.id])) {
                    result[fieldRow.id][fieldRow.language_id] = {
                        label: fieldRow.label,
                        description: fieldRow.description
                    };
                }
            }
            return result;
        }, {});
        callback(null, Object.assign({}, context, {fieldsProcessed}));
    },
    // 4. compare label, description for selected languages
    (context, callback) => {
        const {fieldsProcessed, fieldsParRules} = context;
        const standartColumns = ['CHROM', 'POS', 'REF', 'ALT', 'ID', 'FILTER'];
        const exstFields = _.groupBy(fieldsProcessed, 'source_name');

        _.forEach(fieldsParRules, (fileData) => {

            let newFields = [];
            let newTranslations = [];

            _.forEach(fileData.fields, (prField) => {

                const existingField = _.remove(exstFields[prField.source_name], (item) => {
                    return (item.name === prField.column_name &&
                        item.source_name === prField.source_name);
                    /* 'value_type': prField.value_type,
                     'dimension': +prField.dimension*/
                });
                if (!existingField) {
                    // console.warn(`${JSON.stringify(prField)} is not found in database.`);
                    if (!_.includes(standartColumns, prField.column_name)) {
                        newFields.push(prField); // add new field to diff.json
                    }
                } else {
                    _.forEach(languages, (language) => {

                        const translation = compareFields(existingField, prField, language);
                        if (translation) {
                            const f = _.find(newTranslations, {id: existingField.id});
                            if (f) {
                                f[language] = translation;
                            } else {
                                const updateTranslationInfo = {
                                    id: existingField.id,
                                    column_name: existingField.name,
                                };
                                updateTranslationInfo[language] = translation;
                                newTranslations.push(updateTranslationInfo);
                            }
                        }
                    });
                }
            });

            fs.writeFileSync(`${fileData.inputPath}.dif.json`, JSON.stringify({
                generated: new Date(),
                newFieldsCount: newFields.length,
                newTranslationsCount: newTranslations.length,
                newFields,
                newTranslations
            }, null, 2));
        });

        // 5. The rest of the existing fields should be logged, because they haven't entries in the parsing rule files.
        _.forEach(exstFields, (fields) => {
            if (!_.isEmpty(fields)) {
                console.log(`Warning: database contains ${fields.length} unknown fields for '${fields[0].source_name}':`);
                _.forEach(fields, (field) => {
                    console.log(`==> ${JSON.stringify(field)}`);
                });
            }
        });
        callback(null, context);
    }
], (error) => {
    if (error) {
        console.error(`Failed to update labels: ${error}`);
        process.exit(1);
    } else {
        console.log('Labels and migration are successfully generated.');

    }
});



