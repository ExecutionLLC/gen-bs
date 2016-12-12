const _ = require('lodash');
const Promise = require('bluebird');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const tables = {
    VcfFile: 'vcf_file',
    Sample: 'sample',
    SampleText: 'sample_text',
    SampleField: 'sample_field',
    SampleEditableField: 'sample_editable_field',
    FieldMetadata: 'field_metadata',
    AnalysisSample: 'analysis_sample'
};

const oldTables = {
    VcfFileSample: 'vcf_file_sample',
    SampleUploadHistory: 'sample_upload_history',
    SampleGenotype: 'sample_genotype',
    GenotypeField: 'genotype_field',
    GenotypeVersion: 'genotype_version',
    GenotypeText: 'genotype_text',
    VcfFileSampleValue: 'vcf_file_sample_value',
    QueryHistoryFilter: 'query_history_filter',
    QueryHistory: 'query_history'
};


function createEnum(keyValueObject) {
    return Object.assign({}, keyValueObject, {
        allValues: _.map(keyValueObject)
    });
}


const SAMPLE_UPLOAD_STATUS = createEnum({
    IN_PROGRESS: 'in_progress',     // Currently active
    READY: 'ready',                 // Successfully uploaded
    ERROR: 'error'                  // Failed with error
});

const ENTITY_TYPES = createEnum({
    STANDARD: 'standard', // Available for demo user
    ADVANCED: 'advanced', // Shown in demo, but locked. Available for registered users.
    USER: 'user', // Created by user.
    DEFAULT: 'default' //default entity type
});

exports.up = function (knex) {
    console.log('=> Update sample schema...');
    return updateVcfTable(knex)
        .then(() => updateSampleGenotypeTable(knex))
        .then(() => createSampleTables(knex))
        .then(() => updateSampleInformation(knex))
        .then(() => updateUploadFileInformation(knex))
        .then(() => appendAnalysesSampleId(knex))
        .then(() => updateSampleTablesData(knex))
        .then(() => removeAnalysesSampleGenotypeVersionRef(knex))
        .then(() => dropGenotypeTables(knex))
        .then(() => dropDefaultVcfTable(knex))
        .then(() => dropVcfFileOldTable(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function appendAnalysesSampleId(knex) {
    return knex.schema.table(tables.AnalysisSample, (table) => {
        table.uuid('sample_id')
            .references('id')
            .inTable(tables.Sample);
    });
}

function dropVcfFileOldTable(knex) {
    return knex.schema.table(tables.VcfFile, (table) => {
        table.dropColumn('is_analyzed');
        table.dropColumn('analyzed_timestamp');
        table.dropColumn('type');
    })
}

function dropGenotypeTables(knex) {
    return knex.schema.dropTable(oldTables.VcfFileSampleValue)
        .dropTable(oldTables.GenotypeText)
        .dropTable(oldTables.QueryHistoryFilter)
        .dropTable(oldTables.QueryHistory)
        .dropTable(oldTables.GenotypeVersion);
}

function updateSampleTablesData(knex) {
    return findGenotypeLastVersions(knex)
        .then((genotypeVersions) => {
            return Promise.mapSeries(genotypeVersions, version => {
                const {sampleGenotypeId, name, description, languId} = version;
                return addSampleText({
                    sampleId: sampleGenotypeId,
                    name,
                    description,
                    languageId: languId
                }, knex);
            })
                .then(() => Promise.mapSeries(genotypeVersions, version => {
                    const {id, sampleGenotypeId} = version;
                    return findSampleValuesByGenotypeVersionId(id, knex)
                        .then((sampleValues) => Promise.mapSeries(sampleValues, sampleValue => {
                            const {fieldId, values} = sampleValue;
                            return addSampleEditableField({
                                fieldId,
                                value: values,
                                sampleId: sampleGenotypeId
                            }, knex);
                        }));
                }))
                .then(() => Promise.mapSeries(genotypeVersions, version => {
                    const {id, sampleGenotypeId} = version;
                    return updateAnalyses(sampleGenotypeId, id, knex);
                }));
        })
}

function updateAnalyses(sampleId, genotypeVersionId, knex) {
    return knex(tables.AnalysisSample)
        .where('genotype_version_id', genotypeVersionId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            sampleId
        }));
}

function removeAnalysesSampleGenotypeVersionRef(knex) {
    return knex.schema.table(tables.AnalysisSample, (table) => {
        table.dropColumn('genotype_version_id');
    })
}

function addSampleEditableField(field, knex) {
    return knex(tables.SampleEditableField)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(field));
}

function addSampleText(sampletext, knex) {
    return knex(tables.SampleText)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(sampletext));
}

function findGenotypeLastVersions(knex) {
    return knex.select()
        .from(oldTables.GenotypeVersion)
        .leftJoin(
            oldTables.GenotypeText,
            `${oldTables.GenotypeVersion}.id`,
            `${oldTables.GenotypeText}.genotype_version_id`
        )
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
        .then((results) => {
            const sampleVersionGroups = _.groupBy(results, 'sampleGenotypeId');
            return _.map(sampleVersionGroups, versions => {
                const orderedVersions = _.orderBy(versions, ['timestamp'], ['desc']);
                return _.head(orderedVersions);
            });
        });
}

function findSampleValuesByGenotypeVersionId(genotypeVersionId, knex) {
    return knex.select()
        .from(oldTables.VcfFileSampleValue)
        .where('genotype_version_id', genotypeVersionId)
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function createSampleTables(knex) {
    return knex.schema
        .createTable(tables.SampleText, (table) => {
            table.uuid('sample_id')
                .references('id')
                .inTable('sample');
            table.string('language_id', 2)
                .references('id')
                .inTable('langu');
            table.string('name', 50);
            table.text('description');

            table.primary(['sample_id', 'language_id']);
        })
        .createTable(tables.SampleEditableField, (table) => {
            table.uuid('sample_id')
                .references('id')
                .inTable('sample');
            table.uuid('field_id')
                .references('id')
                .inTable(tables.FieldMetadata);
            table.string('value', 100);
        })
        .renameTable(oldTables.GenotypeField, tables.SampleField)
        .table(tables.SampleField, table => {
            table.renameColumn('genotype_id', 'sample_id');
        });
}

function updateSampleGenotypeTable(knex) {
    return knex.schema.renameTable(oldTables.SampleGenotype, tables.Sample)
        .table(tables.Sample, table => {
            table.renameColumn('vcf_file_sample_id', 'vcf_file_id');
            table.boolean('is_analyzed')
                .defaultTo(false);
            table.timestamp('analyzed_timestamp');
            table.enu('type', [
                ENTITY_TYPES.USER,
                ENTITY_TYPES.ADVANCED,
                ENTITY_TYPES.DEFAULT,
                ENTITY_TYPES.STANDARD
            ]);
            table.timestamp('created')
                .defaultTo(knex.fn.now());
        });
}

function dropDefaultVcfTable(knex) {
    return knex.raw(`ALTER TABLE ${tables.VcfFile} ALTER COLUMN status DROP DEFAULT`)
        .then(() => knex.raw(`ALTER TABLE ${tables.VcfFile} ALTER COLUMN progress DROP DEFAULT`))
        .then(() => knex.raw(`ALTER TABLE ${tables.Sample} ALTER COLUMN type DROP DEFAULT`))

}

function updateVcfTable(knex) {
    return knex.schema.renameTable(oldTables.VcfFileSample, tables.VcfFile)
        .table(tables.VcfFile, table => {
            table.renameColumn('timestamp', 'created');
            table.enu('status', [
                SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
                SAMPLE_UPLOAD_STATUS.READY,
                SAMPLE_UPLOAD_STATUS.ERROR
            ])
                .notNullable()
                .defaultTo(SAMPLE_UPLOAD_STATUS.READY);
            table.integer('progress')
                .notNullable()
                .defaultTo(100);
            table.json('error')
        });
}

function updateUploadFileInformation(knex) {
    return findUploadHistories(knex)
        .then((histories) => {
            return Promise.mapSeries(histories, history => updateVcfFile(history, knex))
                .then(() => dropUploadHistoryModel(knex));
        })
}

function dropUploadHistoryModel(knex) {
    return knex.schema.dropTable(oldTables.SampleUploadHistory);
}

function updateSampleInformation(knex) {
    return findVcfFileSample(knex)
        .then((vcfFileSamples) => {
            return Promise.mapSeries(vcfFileSamples, vcfFileSample => updateVcfFileSample(vcfFileSample, knex));
        });
}

function findVcfFileSample(knex) {
    return knex.select()
        .from(tables.VcfFile)
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function findUploadHistories(knex) {
    return knex.select()
        .from(oldTables.SampleUploadHistory)
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function updateVcfFile(history, knex) {
    const {sampleId, status, progress, error, isDeleted, created} = history;
    return knex(tables.VcfFile)
        .where('id', sampleId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            status,
            progress,
            error,
            isDeleted,
            created
        }));
}

function updateVcfFileSample(vcfFileSample, knex) {
    const {id, isAnalyzed, analyzedTimestamp, type} = vcfFileSample;
    return knex(tables.Sample)
        .where('vcf_file_id', id)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            isAnalyzed,
            analyzedTimestamp,
            type
        }));
}