const Uuid = require('node-uuid');
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');

const FsUtils = require('./utils/FileSystemUtils');
const Config = require('./utils/Config');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');
const fieldsTableNames = {
    Metadata: 'field_metadata',
    Text: 'field_text'
};
const sampleTableNames = {
    Metadata: 'vcf_file_sample',
    Genotypes: 'sample_genotype',
    Versions: 'genotype_version',
    Values: 'vcf_file_sample_value'
};

function createEnum(keyValueObject) {
    return Object.assign({}, keyValueObject, {
        allValues: _.map(keyValueObject)
    });
}

const ENTITY_TYPES = createEnum({
    STANDARD: 'standard',
    ADVANCED: 'advanced',
    USER: 'user',
    DEFAULT: 'default'
});

const sampleDir = '20161005115436_default-samples-update';
const defaultSampleName = "Patient's VCF File";
const defaultsDir = path.join(__dirname, sampleDir);

function deleteOldDefaultSamples(knex) {
    console.log('==> Deleting old default samples...');
    return knex(sampleTableNames.Metadata)
        .whereNull('creator')
        .update({
            is_deleted: true
        });
}

function makeDefaultSample(knex, sampleName) {
    console.log('==> Make defualt sample...');
    return knex(sampleTableNames.Metadata)
        .where('file_name', sampleName)
        .update({
            type: ENTITY_TYPES.DEFAULT
        });
}

function addNewSamplesToDatabase(knex, defaultsDir) {
    return Promise.fromCallback((callback) => FsUtils.getAllFiles(defaultsDir, '.json', callback))
        .mapSeries((file)=>createSampleFromFile(knex, file));
}

function createSampleFromFile(knex, metadataFilePath) {
    const metadataString = FsUtils.getFileContentsAsString(metadataFilePath);
    const metadata = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(metadataString));
    const sampleFileName = path.basename(metadataFilePath).replace('metadata_', '').replace('.json', '');
    const sample = {
        fileName: sampleFileName,
        hash: null,
        type: ENTITY_TYPES.STANDARD
    };
    const {columns, genotypes} = metadata;
    const fields = _.map(columns, asField => convertFieldMetadata(null, true, asField));
    return addAppSample(knex, sample, fields, genotypes);
}

function convertFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
    return {
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

function addAppSample(knex, sample, fields, genotypes) {
    return addMissingFields(knex, fields)
        .then((fieldsWithIds) => {
            return findEditableFields(knex)
                .then((fieldsMetadata)=> {
                    const mappedFields = _.map(fieldsMetadata || [], fieldMetadata => {
                        return {
                            id: fieldMetadata.id,
                            fieldMetadata
                        }
                    });
                    return fieldsWithIds.concat(mappedFields)
                })
                .then((sampleFieldsWithIds) => {
                    const sampleWithValues = Object.assign({}, sample, {
                        values: _.map(sampleFieldsWithIds, fieldWithId => ({
                            fieldId: fieldWithId.id,
                            value: null
                        }))
                    });
                    return addSampleInTransaction(knex, sampleWithValues, genotypes)
                })
        })
}

function addMissingFields(knex, fields) {
    console.log('==> Add Missing Fields...');
    const uniqueFields = _.uniqBy(fields, (field) => {
        return `${field.name}#${field.valueType}#${field.dimension}`
    });
    return Promise.mapSeries(uniqueFields, field => {
        return findIdOfTheSameAsOrNullInTransaction(knex, field)
            .then((id)=> id ? id : addField(knex, field))
            .then((id) => {
                return Object.assign({}, field, {
                    id
                });
            });
    })
        .then((fieldsWithIds) => Promise.mapSeries(fieldsWithIds, fieldWithId => {
                if (!fieldWithId.id) {
                    return addField(knex, fieldWithId)
                } else {
                    return fieldWithId
                }
            })
        )
}

function findIdOfTheSameAsOrNullInTransaction(knex, fieldMetadata) {
    return knex.select('id')
        .from(fieldsTableNames.Metadata)
        .where('name', fieldMetadata.name)
        .andWhere('value_type', fieldMetadata.valueType)
        .andWhere('dimension', fieldMetadata.dimension)
        .then((results) => (results && results.length) ? results[0].id : null);
}

function addField(knex, field) {
    console.log('==> Add Field :', field.name);
    const {
        name, sourceName, valueType, isMandatory, isEditable, isInvisible,
        dimension, isHyperlink, hyperlinkTemplate, description, label
    } = field;
    const id = Uuid.v4();
    return knex(fieldsTableNames.Metadata)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            id,
            name,
            sourceName,
            valueType,
            isMandatory,
            isEditable,
            isInvisible,
            dimension,
            isHyperlink: isHyperlink || false,
            hyperlinkTemplate: hyperlinkTemplate || null
        }))
        .then(() => knex(fieldsTableNames.Text
        ).insert(ChangeCaseUtil.convertKeysToSnakeCase({
            fieldId: id,
            label,
            description,
            languId: Config.defaultLanguId
        }))).then(() => findIdOfTheSameAsOrNullInTransaction(knex, field));
}

function findEditableFields(knex) {
    return knex.select()
        .from(fieldsTableNames.Metadata)
        .where('is_editable', true);
}

function addSampleInTransaction(knex, sampleWithValues, genotypes) {
    return addSample(knex, sampleWithValues)
        .then((sampleId) => {
            return setAnalyzed(knex, sampleId, true)
                .then(() => {
                    return createGenotypes(knex, sampleId, genotypes)
                })
                .then((genotypeIds) => {
                    return Promise.all(
                        genotypeIds.map((genotypeId) => addGenotypeVersion(knex, genotypeId))
                    ).mapSeries((genotypeVersionId) => {
                        return addGenotypeValues(knex, genotypeVersionId, sampleWithValues.values)
                    });
                });
        })
}

function addSample(knex, sample) {
    console.log('==> Add Sample :', sample.fileName);
    const {fileName, hash, type} = sample;
    const id = Uuid.v4();
    return knex(sampleTableNames.Metadata)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            id,
            fileName,
            hash,
            type
        }))
        .then(() => id)
}

function setAnalyzed(knex, sampleId, value) {
    return knex(sampleTableNames.Metadata)
        .where('id', sampleId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            isAnalyzed: value,
            analyzedTimestamp: value ? new Date() : null
        }));
}

function createGenotypes(knex, sampleId, genotypes) {
    return Promise.map(genotypes, (genotypeName) => {
        const id = Uuid.v4();
        return knex(sampleTableNames.Genotypes)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                id,
                vcfFileSampleId: sampleId,
                genotypeName
            }))
            .then(() => id)
    })
}

function addGenotypeVersion(knex, genotypeId) {
    console.log('==> Add Genotype Version for genotype id:', genotypeId);
    const id = Uuid.v4();
    return knex(sampleTableNames.Versions)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            id,
            sampleGenotypeId: genotypeId,
            timestamp: new Date()
        }))
        .then(() => id)
}

function addGenotypeValues(knex, versionId, values) {
    return Promise.map(values, ({fieldId, values}) => {
        return knex(sampleTableNames.Values)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                genotypeVersionId: versionId,
                fieldId,
                values
            }))
    });
}

exports.up = function (knex) {
    console.log('Default Samples Update:');
    // Mark old default samples as deleted.
    return deleteOldDefaultSamples(knex)
    // Add metadata for new default samples.
        .then(() => addNewSamplesToDatabase(knex, defaultsDir))
        .then(() => makeDefaultSample(knex, defaultSampleName));
};

exports.down = function () {
    throw new Error('Not implemented');
};

exports.addNewSamplesToDatabase = addNewSamplesToDatabase;
