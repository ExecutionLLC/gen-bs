const _ = require('lodash');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const sampleTableNames = {
    Genotypes: 'sample_genotype',
    Versions: 'genotype_version',
    Values: 'vcf_file_sample_value',
    Fields: 'genotype_field'
};

const fieldsTableNames = {
    Metadata: 'field_metadata'
};


exports.up = function (knex, Promise) {
    console.log('=> Migrate editable fields...');
    return createTableGenotypeFieldMetadata(knex, Promise)
        .then(() => addDeleteGenotypeFlag(knex, Promise))
        .then(() => migrateFields(knex, Promise));
};

exports.down = function (knex, Promise) {

};

function createTableGenotypeFieldMetadata(knex) {
    return knex.schema
        .createTable(sampleTableNames.Fields, (table) => {
            table.uuid('field_id')
                .references('id')
                .inTable(fieldsTableNames.Metadata);
            table.uuid('genotype_id')
                .references('id')
                .inTable(sampleTableNames.Genotypes);
        });
}

function addDeleteGenotypeFlag(knex) {
    return knex.schema
        .table(sampleTableNames.Genotypes, (table) => {
            table.boolean('is_deleted')
                .defaultTo(false);
        })
}

function migrateFields(knex, Promise) {
    return findEditableFieldIds(true, knex)
        .then((editableIds) => {
            return findGenotypeIds(knex, Promise)
                .then((genotypeIds) => Promise.map(genotypeIds, genotypeId => {
                    return findGenotypeVersions(genotypeId, knex, Promise)
                        .then((versions) => Promise.map(versions, version => {
                            const notEditableFields = _.filter(version.fields, field => !_.includes(editableIds, field.id));
                            const notEditableFieldIds = _.map(notEditableFields, field => field.id);
                            return addFieldsToGenotype(notEditableFieldIds, genotypeId, knex, Promise)
                                .then(() => deleteGenotypeSampleFieldsValues(notEditableFieldIds, version.id, knex));
                        }));
                }));
        });

}

function findGenotypeIds(knex) {
    return knex.select('id')
        .from(sampleTableNames.Genotypes)
        .then((results) => _.map(results, result => result.id));
}

function findEditableFieldIds(isEditable, knex) {
    return knex.select('id')
        .from(fieldsTableNames.Metadata)
        .where('is_editable', isEditable)
        .then((results) => _.map(results, result => result.id));
}

function findGenotypeVersions(genotypeId, knex) {
    return knex.select()
        .from(sampleTableNames.Versions)
        .leftJoin(sampleTableNames.Values, `${sampleTableNames.Values}.genotype_version_id`, `${sampleTableNames.Versions}.id`)
        .where('sample_genotype_id', genotypeId)
        .then((results) => {
            const versionGroups = _.groupBy(results, 'genotype_version_id');
            return _.map(versionGroups, _createGenotypeVersion);
        });
}

function _createGenotypeVersion(genotypeGroup) {
    const camelCaseGenotypeVersion = ChangeCaseUtil.convertKeysToCamelCase(
        genotypeGroup
    );
    const {genotypeVersionId} = camelCaseGenotypeVersion[0];
    return {
        id: genotypeVersionId,
        fields: _.map(camelCaseGenotypeVersion, sampleValue => ({
            id: sampleValue.fieldId,
            value: sampleValue.values
        }))
    };
}

function addFieldsToGenotype(fieldIds, genotypeId, knex, Promise) {
    return Promise.map(fieldIds, fieldId => addFieldToGenotype(fieldId, genotypeId, knex))
}

function addFieldToGenotype(fieldId, genotypeId, knex) {
    return knex(sampleTableNames.Fields)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            fieldId,
            genotypeId
        }))
}

function deleteGenotypeSampleFieldsValues(fieldIds, genotypeVersionId, knex) {
    return knex(sampleTableNames.Values)
        .whereIn('field_id', fieldIds)
        .andWhere('genotype_version_id', genotypeVersionId)
        .del();
}
