'use strict';

const Knex = require('knex');
const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const assert = require('assert');
const npm = require('npm');
const path = require('path');

const {processRulesFile, isBlank} = require('./parse-fields-labels');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');
const Config = require('../../utils/Config');

const languages = ['en', 'ru'];

const parsingRulesPath = path.join(__dirname, '../../../VCFUtils/docs/parsing-rules-translate');

const sources = [
    {
        sourceName: 'clinvar_20160705_v01',
        fileName: 'ClinVar.txt'
    },
    {
        sourceName: 'dbsnp_20160601_v01',
        fileName: 'dbSNP.txt'
    },
    {
        sourceName: 'ESP6500_v01',
        fileName: 'ESP6500.txt'
    },
    {
        sourceName: 'ExAC_r0_3_1_sites_v01',
        fileName: 'ExAC.txt'
    },
    {
        sourceName: 'one_thousand_genome_v01',
        fileName: '1000genomes.txt'
    },
    {
        sourceName: 'sample',
        fileName: 'vcf.txt'
    },
    {
        sourceName: 'sample',
        fileName: 'vep.txt'
    }
];

const migrationsFolder = './database/migrations';
const migrationTemplateFilePath = './database/defaults/update-fields-migration-template.js';

function getUpdateFieldsMigrations() {
    return _.filter(fs.readdirSync(migrationsFolder), (filename) => {
        return (filename.match(/^\d+_update-fields\.js$/) !== null);
    });
}

function hasTranslation(obj, language) {
    return obj[language] && (obj[language].label || obj[language].description);
}

function createTranslation(fieldDb, fieldTxt, language) {

    if (!fieldTxt[language] || (!fieldTxt[language].label && !fieldTxt[language].description)) {
        // console.log(`Warning: field ${JSON.stringify(fieldTxt)} doesn't contain translation for '${language}'`);
        return null;
    }

    let newLabel = '';
    let newDescription = '';
    if (isBlank(fieldTxt[language].label)) {
        // console.log(`Warning: field ${JSON.stringify(fieldTxt)} contains empty label for '${language}'`);
    } else {
        newLabel = fieldTxt[language].label;
    }
    if (isBlank(fieldTxt[language].description)) {
        // console.log(`Warning: field ${JSON.stringify(fieldTxt)} contains empty description for '${language}'`);
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

function generateMigration(callback) {
    async.waterfall([
        (callback) => {
            const ufMigrationsBefore = getUpdateFieldsMigrations();
            npm.load({}, (error) => {
                if (error) {
                    callback(error);
                } else {
                    npm.commands.run(['db:migrate:make', 'update-fields'], (error) => {
                        if (error) {
                            callback(error);
                        } else { // command succeeded
                            const ufMigrationsAfter = getUpdateFieldsMigrations();
                            const diffArr = _.difference(ufMigrationsAfter, ufMigrationsBefore);
                            if (diffArr.length) {
                                callback(null, diffArr[0]);
                            } else {
                                callback(new Error('Cannot create database migration.'));
                            }
                        }
                    });
                }
            });
        },
        (migrationFileName, callback) => {
            const migrationFilePath = `${migrationsFolder}/${migrationFileName}`;

            // 1. create folder for migration files
            const migrationDataFolder = migrationFilePath.slice(0, -3);
            if (!fs.existsSync(migrationDataFolder)){
                fs.mkdirSync(migrationDataFolder);
            }

            // 2. generate migration
            fs.readFile(migrationTemplateFilePath, 'utf8', (error, data) => {
                if (error) {
                    callback(error);
                } else {
                    const migrationText = data.replace(/AUTO_GENERATED_DATA_FOLDER_PATH/g,
                        path.basename(migrationFilePath, path.extname(migrationFilePath)));

                    fs.writeFile(migrationFilePath, migrationText, 'utf8', (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            callback(null, migrationDataFolder);
                        }
                    });
                }
            });
        }
    ],
    (error, migrationDataFolder) => {
        if (error) {
            console.log(error);
        } else {
            callback(migrationDataFolder);
        }
    });
}

async.waterfall([
    // 1. Parse txt files
    (callback) => {
        const fieldsParRules = _.map(sources, (item) => {
            return {
                fileName: item.fileName,
                fields: processRulesFile(`${parsingRulesPath}/${item.fileName}`, item.sourceName, languages),
                sourceName: item.sourceName
            }
        });
        callback(null, {fieldsParRules});
    },
    // 2. Create and configure Knex, get fields from DB
    (context, callback) => {
        const {fieldsParRules} = context;
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
        let query = knex
            .select('*')
            .from('field')
            .leftJoin('field_text', 'field.id', 'field_text.field_id')
            .whereIn('source_name', _.uniq(_.map(fieldsParRules, item => item.sourceName)));
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

        let newData = [];

        _.forEach(fieldsParRules, (fileData) => {

            let newFields = [];
            let newTranslations = [];

            let generateTranslationsForField = function (existingField, prField) {
                _.forEach(languages, (language) => {
                    const translation = createTranslation(existingField, prField, language);
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
            };

            _.forEach(fileData.fields, (prField) => {

                const existingFieldArr = _.remove(exstFields[prField.source_name], (item) => {
                    return (item.name === prField.column_name && item.source_name === prField.source_name);
                });
                if (_.isEmpty(existingFieldArr)) {
                    if (!_.includes(standartColumns, prField.column_name)) {
                        if (fileData.sourceName !== 'sample') {
                            console.log(`ERROR: found new field ${JSON.stringify(prField)} in ${fileData.fileName}`);
                        } else {
                            console.log(`INFO: found new field ${JSON.stringify(prField)} in ${fileData.fileName}`);
                            newFields.push(prField);
                        }
                    }
                } else if (existingFieldArr.length === 1) {
                    const dbField = existingFieldArr[0];
                    const valueTypeEquals = dbField.value_type === prField.value_type;
                    const dimensionEquals = dbField.dimension !== prField.dimension;

                    if (!valueTypeEquals || !dimensionEquals) {

                        const msg = `value type and/or dimension mismatch between \n\tDB: ${JSON.stringify(dbField)} \n\tTXT: ${JSON.stringify(prField)}`;

                        if (fileData.sourceName === 'sample') {
                            console.log(`WARNING: ${msg}`); // and not update translation
                            console.log(`WARNING: cannot update translation for ${prField.column_name}`);
                        } else {
                            console.log(`WARNING: ${msg}`);
                            generateTranslationsForField(dbField, prField);
                        }
                    } else {
                        generateTranslationsForField(dbField, prField);
                    }

                } else {
                    const dbField = _.find(existingFieldArr, {value_type: prField.value_type, dimension: +prField.dimension});
                    if (dbField) {
                        generateTranslationsForField(dbField, prField);
                    } else {
                        console.log(`ERROR: cannot update translation for ${prField.column_name}. Found ${existingFieldArr.length} ambiguous variants:`);
                        _.forEach(existingFieldArr, (variant) => {
                            console.log(`${JSON.stringify(variant)}`);
                        });
                    }
                }
            });
            if (newFields.length || newTranslations.length) {
                newData.push({
                    fileName: fileData.fileName,
                    newFields,
                    newTranslations
                });
            }
        });
        callback(null, Object.assign({}, context, {newData, exstFields}));
    },
    // 5. The rest of the existing fields should be logged, because they haven't entries in the parsing rule files.
    (context, callback) => {
        const {exstFields} = context;
        _.forEach(exstFields, (fields, sourceName) => {
            if (sourceName !== 'sample' && !_.isEmpty(fields)) {
                 console.log(`Warning: database contains ${fields.length} unknown fields for '${sourceName}':`);
                _.forEach(fields, (field) => {
                    console.log(`==> ${JSON.stringify(field)}`);
                });
            }
        });
        callback(null, context);
    },
    // 6. Generate migration
    (context, callback) => {
        const {newData} = context;
        if (newData.length) {
            generateMigration((migrationDataFolder) => callback(null, Object.assign({}, context, {migrationDataFolder})));
        } else {
            callback(new Error('No new updates found'));
        }
    },
    // 7. Write JSON files with the data
    (context, callback) => {
        const {newData, migrationDataFolder} = context;
        _.forEach(newData, (item) => {
            const fileName = path.basename(item.fileName, path.extname(item.fileName));
            fs.writeFileSync(`${migrationDataFolder}/${fileName}.dif.json`, JSON.stringify({
                generated: new Date(),
                newFieldsCount: item.newFields.length,
                newTranslationsCount: item.newTranslations.length,
                newFields: item.newFields,
                newTranslations: item.newTranslations
            }, null, 2));
        });
        callback(null);
    }
], (error) => {
    if (error) {
        console.error(`Failed: ${error}`);
        process.exit(1);
    } else {
        console.log('Migration was successfully generated.');
        process.exit(0);
    }
});
