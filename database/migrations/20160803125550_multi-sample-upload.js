// See the issue for more information: https://github.com/ExecutionLLC/gen-bs/issues/447
const assert = require('assert');
const Uuid = require('node-uuid');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');
const Config = require('./utils/Config');

const ONE_SAMPLE_GENOTYPE_NAME = Config.oneSampleGenotypeName;

function addSampleTimestamp(knex, Promise) {
    console.log('=> Adding sample timestamp...');
    const {schema} = knex;
    return Promise.join(
        schema.table('vcf_file_sample', (table) => {
            table.timestamp('timestamp')
                .defaultTo(null);
        }),
        // Set UNIX epoch start as the creation date to distinguish existing samples from new ones.
        knex('vcf_file_sample')
            .whereNull('timestamp')
            .update({timestamp: new Date(0)}),
        // For new samples, set the created date to now().
        knex.raw('ALTER TABLE vcf_file_sample ALTER COLUMN timestamp SET DEFAULT current_timestamp')
    );
}

function fixFieldMetadataNameColumn(knex, Promise) {
    return knex.raw('ALTER TABLE field_metadata ALTER COLUMN name SET NOT NULL');
}

function createGenotypeTablesAndColumns(knex, Promise) {
    console.log('=> Creating genotype-related tables...');
    const {schema} = knex;
    return schema
        .createTableIfNotExists('sample_genotype', (table) => {
            table.uuid('id')
                .primary();
            table.uuid('vcf_file_sample_id')
                .references('id')
                .inTable('vcf_file_sample');
            table.string('genotype_name');
        })
        .createTableIfNotExists('genotype_version', (table) => {
            table.uuid('id')
                .primary();
            table.uuid('sample_genotype_id')
                .references('id')
                .inTable('sample_genotype');
            table.timestamp('timestamp')
                .defaultTo(knex.fn.now());
        })
        .table('vcf_file_sample_value', (table) => {
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version');
        })
        .table('saved_file', (table) => {
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version')
        })
        .table('query_history', (table) => {
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version');
        });
}

/**
 * @returns {Promise<Object>} sampleId -> genotypeId hash
 * */
function createGenotypesForExistingSamples(knex, Promise) {
    console.log('=> Creating genotypes for existing samples...');
    return knex('vcf_file_sample')
        .select('id')
        .then((sampleObjects) => {
            return sampleObjects.map(sample => sample.id)
            // Create genotype id for each version.
                .reduce((result, sampleId) => {
                    result[sampleId] = Uuid.v4();
                    return result;
                }, {});
        })
        .then((sampleIdToGenotypeIdHash) => {
            // Insert all created genotypes.
            return Promise.all(Object
                .keys(sampleIdToGenotypeIdHash)
                .map((sampleId) => knex('sample_genotype')
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                        id: sampleIdToGenotypeIdHash[sampleId],
                        vcfFileSampleId: sampleId,
                        genotypeName: ONE_SAMPLE_GENOTYPE_NAME
                    }))
                )
            ).then(() => sampleIdToGenotypeIdHash);
        });
}

function makeSampleVersionsToBeGenotypeVersions(knex, Promise, sampleIdToGenotypeId) {
    console.log('=> Converting sample versions to genotype versions...');
    return knex('vcf_file_sample_version')
        .select('id', 'vcf_file_sample_id', 'timestamp')
        .then((sampleVersions) => ChangeCaseUtil.convertKeysToCamelCase(sampleVersions))
        // Create genotype version object from the sample version
        .then((sampleVersions) => Promise.all(sampleVersions
            .map((sampleVersion) => ({
                id: sampleVersion.id,
                sampleGenotypeId: sampleIdToGenotypeId[sampleVersion.vcfFileSampleId],
                timestamp: sampleVersion.timestamp
            }))
            .map(({id, sampleGenotypeId, timestamp}) => {
                assert.ok(id);
                assert.ok(sampleGenotypeId);
                assert.ok(timestamp);

                return knex('genotype_version')
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase({id, sampleGenotypeId, timestamp}));
            })
        ))
}

function createAndFillGenotypeVersionIdInSampleValuesTable(knex, Promise) {
    console.log('=> Adding genotypes to sample values table...');
    return knex('vcf_file_sample_value')
        .distinct('vcf_file_sample_version_id')
        .select()
        .then((valueObjects) => ChangeCaseUtil.convertKeysToCamelCase(valueObjects))
        .then((valueObjects) => valueObjects.map(valueObj => valueObj.vcfFileSampleVersionId))
        .then((sampleVersionIds) => Promise.all(
            sampleVersionIds.map((versionId) => knex('vcf_file_sample_value')
                .where('vcf_file_sample_version_id', versionId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    genotypeVersionId: versionId
                }))
            ))
        );
}

function createAndFillGenotypeIdInSavedFilesTable(knex, Promise) {
    console.log('=> Adding genotypes to saved files table...');
    return knex('saved_file')
        .distinct('vcf_file_sample_version_id')
        .select()
        .then((versionObjects) => ChangeCaseUtil.convertKeysToCamelCase(versionObjects))
        .then((versionObjects) => versionObjects.map(versionObject => versionObject.vcfFileSampleVersionId))
        .then((versionIds) => Promise.all(
            versionIds.map(versionId => knex('saved_file')
                .where('vcf_file_sample_version_id', versionId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    genotypeVersionId: versionId
                })))
        ));
}

function createAndFillGenotypeIdInQueryHistoryTable(knex, Promise) {
    console.log('=> Adding genotypes to query history table...');
    return knex('query_history')
        .distinct('vcf_file_sample_version_id')
        .select()
        .then((versionObjects) => ChangeCaseUtil.convertKeysToCamelCase(versionObjects))
        .then((versionObjects) => versionObjects.map(versionObject => versionObject.vcfFileSampleVersionId))
        .then((versionIds) => Promise.all(
            versionIds.map((versionId) => knex('query_history')
                .where('vcf_file_sample_version_id', versionId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    genotypeVersionId: versionId
                })))
        ));
}

function dropSampleVersionIds(knex, Promise) {
    console.log('=> Dropping sample version ids from everywhere...');
    const {schema} = knex;
    return schema
        .table('query_history', (table) => {
            table.dropColumn('vcf_file_sample_version_id');
        })
        .table('saved_file', (table) => {
            table.dropColumn('vcf_file_sample_version_id');
        })
        .table('vcf_file_sample_value', (table) => {
            table.dropColumn('vcf_file_sample_version_id');
        })
        .dropTable('vcf_file_sample_version');
}

exports.up = function (knex, Promise) {
    console.log('Multi-Sample Upload:');
    return addSampleTimestamp(knex, Promise)
        .then(() => fixFieldMetadataNameColumn(knex, Promise))
        .then(() => createGenotypeTablesAndColumns(knex, Promise))
        .then(() => createGenotypesForExistingSamples(knex, Promise))
        .then((sampleIdToGenotypeIdHash) => makeSampleVersionsToBeGenotypeVersions(knex,
            Promise, sampleIdToGenotypeIdHash))
        .then(() => createAndFillGenotypeVersionIdInSampleValuesTable(knex, Promise))
        .then(() => createAndFillGenotypeIdInSavedFilesTable(knex, Promise))
        .then(() => createAndFillGenotypeIdInQueryHistoryTable(knex, Promise))
        .then(() => dropSampleVersionIds(knex, Promise))
        .then(() => console.log('=> Complete.'));
};

exports.down = function (knex, Promise) {
    throw new Error('I am sorry, I was lazy and did not implement the downgrade...');
};
