const BluebirdPromise = require('bluebird');
const _ = require('lodash');

const {rusFilters} = require('./20170124180008_add-ruslanguage-data/filters');
const {rusViews} = require('./20170124180008_add-ruslanguage-data/views');
const {rusModels} = require('./20170124180008_add-ruslanguage-data/models');
const {rusSamples} = require('./20170124180008_add-ruslanguage-data/samples');
const {rusMetadata} = require('./20170124180008_add-ruslanguage-data/metadata');
const {rusMetadataValues} = require('./20170124180008_add-ruslanguage-data/metadataValues');

const RU_ID = 'ru';

exports.up = function (knex) {
    console.log('=> Add rus table data ...');
    return addRusLanguage(knex)
        .then(() => {
            return BluebirdPromise.mapSeries(rusFilters, filter => addFilter(filter, knex))
        })
        .then(() => {
            return BluebirdPromise.mapSeries(rusViews, view => addView(view, knex))
        })
        .then(() => {
            return BluebirdPromise.mapSeries(rusModels, model => addModel(model, knex))
        })
        .then(() => {
            return BluebirdPromise.mapSeries(rusSamples, sample => addSampleText(sample, knex))
        })
        .then(() => {
            return BluebirdPromise.mapSeries(rusMetadata, metadata => addMetadata(metadata, knex))
        })
        .then(() => {
            return BluebirdPromise.mapSeries(rusMetadataValues, metadataValue => addMetadataValues(metadataValue, knex))
        });
};

exports.down = function () {
    throw new Error('Not implemented');
};

function addMetadataValues(metadataValue, knex) {
    return knex.queryBuilder()
        .select('metadata_available_value_id')
        .from('metadata_available_value')
        .leftJoin(
            'metadata_available_value_text',
            'metadata_available_value.id',
            'metadata_available_value_text.metadata_available_value_id'
        )
        .where('metadata_id', metadataValue.metadataId)
        .andWhere('value', metadataValue.value)
        .then((results) => _.first(results)['metadata_available_value_id'])
        .then((id) => {
            return knex('metadata_available_value_text')
                .insert({
                    metadata_available_value_id: id,
                    language_id: RU_ID,
                    value: metadataValue.ruValue
                });
        })
}

function addMetadata(metadata, knex) {
    return knex('metadata')
        .select('id')
        .where('name', metadata.name)
        .then((results) => _.first(results)['id'])
        .then((metadataId) => {
            return knex('metadata_text')
                .insert({
                    metadata_id: metadataId,
                    language_id: RU_ID,
                    description: metadata.ruDescription,
                    label: metadata.ruLabel
                });
        })
}

const GENOTYPE_NAME_MAX_LENGTH = 50;

function createSampleName(fileName, genotype) {
    const name = genotype ? `${fileName}:${genotype}` : fileName;
    return name.substr(-GENOTYPE_NAME_MAX_LENGTH, GENOTYPE_NAME_MAX_LENGTH); // get last GENOTYPE_NAME_MAX_LENGTH chars
}

function addSampleText(sample, knex) {
    return knex('vcf_file')
        .select('id')
        .where('file_name', sample.fileName)
        .then((results) => _.first(results)['id'])
        .then((vcfFileId) => {
            return knex('sample')
                .select(['id', 'genotype_name'])
                .where('vcf_file_id', vcfFileId)
                .then((results) => {
                    return BluebirdPromise.mapSeries(results, result => {
                        return knex('sample_text')
                            .insert({
                                sample_id: result['id'],
                                language_id: RU_ID,
                                name: createSampleName(sample.ruName, result['genotype_name']),
                                description: sample.ruDescription
                            });
                    })
                })
        });
}

function addModel(model, knex) {
    return knex('model_text')
        .select('model_id')
        .where('name', model.enName)
        .then((results) => _.first(results)['model_id'])
        .then((modelId) => {
            return knex('model_text')
                .insert({
                    model_id: modelId,
                    language_id: RU_ID,
                    description: model.ruDescription,
                    name: model.ruName
                })
        });
}

function addView(view, knex) {
    return knex('view_text')
        .select('view_id')
        .where('name', view.enName)
        .then((results) => _.first(results)['view_id'])
        .then((viewId) => {
            return knex('view_text')
                .insert({
                    view_id: viewId,
                    language_id: RU_ID,
                    description: view.ruDescription,
                    name: view.ruName
                });
        });
}

function addFilter(filter, knex) {
    return knex('filter_text')
        .select('filter_id')
        .where('name', filter.enName)
        .then((results) => _.first(results)['filter_id'])
        .then((filterId) => {
            return knex('filter_text')
                .insert({
                    filter_id: filterId,
                    language_id: RU_ID,
                    description: filter.ruDescription,
                    name: filter.ruName
                });
        });
}

function addRusLanguage(knex) {
    return knex('language')
        .insert({
            id: RU_ID,
            description: 'Russian'
        });
}