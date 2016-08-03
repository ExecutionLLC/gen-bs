// See the issue for more information: https://github.com/ExecutionLLC/gen-bs/issues/447
const Uuid = require('node-uuid');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const ONE_SAMPLE_GENOTYPE_NAME = null;

function addSampleTimestamp(knex, Promise) {
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

function createGenotypeTablesAndColumns(knex, Promise) {
    const {schema} = knex;
    return Promise.join(
        schema.createTable('sample_genotype', (table) => {
            table.uuid('id');
            table.uuid('vcf_file_sample_id')
                .references('id')
                .inTable('vcf_file_sample');
            table.string('genotype_name');
        }),
        schema.createTable('genotype_version', (table) => {
            table.uuid('id')
                .primary();
            table.uuid('genotype_id')
                .references('id')
                .inTable('sample_genotype');
            table.timestamp('timestamp')
                .defaultTo(knex.fn.now());
        }),
        schema.table('vcf_file_sample_value', (table) => {
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version');
        })
    );
}

/**
 * @return {Object} sampleId -> genotypeId hash
 * */
function createGenotypesForExistingSamples(knex, Promise) {
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
    return knex('vcf_file_sample_version')
        .select('id', 'vcf_file_sample_id', 'timestamp')
        .then((sampleVersions) => ChangeCaseUtil.convertKeysToCamelCase(sampleVersions))
        .then((sampleVersions) => Promise.all(
            sampleVersions
            // Create genotype version object from the sample version.
                .map((sampleVersion) => ({
                    id: sampleVersion.id,
                    genotypeId: sampleIdToGenotypeId[sampleVersion],
                    timestamp: sampleVersion.timestamp
                }))
                .map(({id, genotypeId, timestamp}) => knex('genotype_version')
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase({id, genotypeId, timestamp}))
                )
        ))
}

exports.up = function (knex, Promise) {
    return addSampleTimestamp(knex, Promise)
        .then(() => createGenotypeTablesAndColumns(knex, Promise))
        .then(() => createGenotypesForExistingSamples(knex, Promise))
        .then((sampleIdToGenotypeIdHash) => makeSampleVersionsToBeGenotypeVersions(knex,
            Promise, sampleIdToGenotypeIdHash))
        ;
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('something_here');
};
