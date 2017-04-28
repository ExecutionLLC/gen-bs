'use strict';

// This script updates labels for existing fields in the database.
// Labels are loaded from templates/metadata/labels/*

const Knex = require('knex');
const _ = require('lodash');
const async = require('async');
const assert = require('assert');

const indexJs = require('./../../index');

const ChangeCaseUtil = indexJs.ChangeCaseUtil;
const Config = indexJs.Config;

const labelTemplates = _([
    './fields/labels/vcf-fields.json',
    './fields/labels/clinvar_20160705_v01.json',
    './fields/labels/ESP6500_v01.json',
    './fields/labels/dbsnp_20160601_v01.json',
    './fields/labels/ExAC_r0_3_1_sites_v01.json',
    './fields/labels/one_thousand_genome_v01.json',
    './fields/labels/vep-fields.json'
])
    .map((path) => require(path))
    .map(ChangeCaseUtil.convertKeysToCamelCase)
    .flatten()
    .value();

// Need to:
// 1. find the field id by name and source name from the 'field_metadata' table.
// 2. update corresponding label in the 'field_text' table.

function doUpdate(callback) {
    async.waterfall([
        // Create and configure Knex library.
        (callback) => {
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
            knex.transaction((trx) => {
                console.log('Transaction started.');
                callback(null, {
                    knex,
                    trx
                });
            });
        },

        // Create query with the list of fields
        // corresponding to the (fieldName, sourceName) pairs we have.
        (context, callback) => {
            const {trx} = context;
            let query = trx.select()
                .from('field_metadata');
            labelTemplates
                .map(template => template.field)
                .forEach(templateField => {
                    query = query.orWhere(function () {
                        this.where('name', templateField.name)
                            .andWhere('source_name', templateField.sourceName);

                        if (templateField.dimension) {
                            this.andWhere('dimension', templateField.dimension);
                        }

                        if (templateField.valueType) {
                            this.andWhere('value_type', templateField.valueType);
                        }
                    });
                });
            query.asCallback((error, fieldsMetadata) => callback(error, Object.assign({}, context, {fieldsMetadata})));
        },

        (context, callback) => {
            const {fieldsMetadata, trx} = context;
            async.forEach(fieldsMetadata, (fieldMetadata, callback) => {
                const targetLabelTemplate = _.find(labelTemplates, (template) => {
                        const {field} = template;
                        return field.name === fieldMetadata.name
                            && field.sourceName == fieldMetadata.source_name
                            && (!field.valueType || field.valueType === fieldMetadata.valueType)
                            && (!field.dimension || field.dimension === fieldMetadata.dimension);
                    }
                );
                assert.ok(targetLabelTemplate);
                trx('field_text')
                    .where('field_id', fieldMetadata.id)
                    .update({label: targetLabelTemplate.label})
                    .asCallback((error) => {
                        console.log(`${fieldMetadata.name} => ${targetLabelTemplate.label}: ${error ? 'FAIL' : 'SUCCESS'}`);
                        callback(error);
                    });
            }, (error) => callback(error, context));
        },

        (context, callback) => {
            const {trx} = context;
            console.log('Committing transaction');
            trx.commit()
                .asCallback(callback);
        }
    ], callback);
}

if (require.main === module) {
    doUpdate((error, context) => {
        if (error) {
            console.error(`Failed to update labels: ${error}`);
            context.trx.rollback()
                .then(() => {
                    console.log('Rollback successful');
                    process.exit(1);
                })
                .catch((error) => {
                    console.log(`Rollback failed: ${error}`);
                    process.exit(1);
                });
        } else {
            console.log('Labels are successfully updated.');
            process.exit(0);
        }
    });
}

module.exports = {
    doUpdate
};
