const Uuid = require('node-uuid');

function deleteOldDefaultSamples(knex) {
    console.log('==> Deleting old default samples...');
    return knex('vcf_file_sample')
        .whereNull('creator')
        .update({
            is_deleted: true
        });
}

function addNewSamplesToDatabase(knex) {
    // Get list of new samples
    // For each sample:
    // - create and insert sample metadata (file name, etc)
    // - create and insert genotypes' metadata
    // - create and insert list of fields for each genotype
}

exports.up = function(knex, Promise) {
    console.log('Default Samples Update:');
    // Mark old default samples as deleted.
    return deleteOldDefaultSamples(knex)
        // Add metadata for new default samples.
        .then(() => addNewSamplesToDatabase(knex));
};

exports.down = function(knex, Promise) {
    throw new Error('Not implemented');
};

function addSample(sampleFileName, appServerSampleFields) {
    // Map AS fields metadata format into local.
    const sampleFields = _.map(appServerSampleFields,
        asField => convertFieldMetadata(null, true, asField));
    const sample = {
        id: sampleId,
        fileName: sampleFileName,
        hash: null
    };
    const uniqueFields = _.uniqBy(sampleFields, (field) => `${field.name}#${field.valueType}#${field.dimension}`);
}

function convertFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
    return {
        id: Uuid.v4(),
        name: appServerFieldMetadata.name,
        label: appServerFieldMetadata.name, // Set label to name by default.
        sourceName: isSample ? 'sample' : sourceName,
        isMandatory: appServerFieldMetadata.isMandatory,
        isEditable: false,
        valueType: appServerFieldMetadata.type,
        description: appServerFieldMetadata.desc,
        dimension: appServerFieldMetadata.num
    };
}

function findIdOfTheSameAsOrNullInTransaction(knex, fieldMetadata) {
    return knex.select('id')
        .from(this.baseTableName)
        .where('name', fieldMetadata.name)
        .andWhere('value_type', fieldMetadata.valueType)
        .andWhere('dimension', fieldMetadata.dimension)
        .then((results) => (results && results.length) ? results[0].id : null);
}
