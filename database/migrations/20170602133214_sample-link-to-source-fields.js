const _ = require('lodash');
const BluebirdPromise = require('bluebird');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');

exports.up = function (knex) {
    console.log('=> Add source field to sample ...');
    return addSourceFieldToSample(knex)
};

exports.down = function (knex, Promise) {

};

function addSourceFieldToSample(knex) {
    return findSourceFieldsIds(knex)
        .then((fieldIds) => {
            return findSampleGenotypesIds(knex)
                .then((sampleIds) => {
                    return BluebirdPromise.mapSeries(sampleIds, sampleId => {
                        return BluebirdPromise.mapSeries(fieldIds, fieldId => {
                            return addSampleField(knex, sampleId, fieldId);
                        });
                    });
                })
        });
}

function addSampleField(knex, sampleId, fieldId) {
    return knex('sample_field')
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            sampleId,
            fieldId
        }));
}

function findSourceFieldsIds(knex) {
    return knex.select('id')
        .from('field')
        .whereNot('source_name', 'sample')
        .then((results) => _.map(results, result => result.id));
}

function findSampleGenotypesIds(knex) {
    return knex.select('id')
        .from('sample')
        .then((results) => _.map(results, result => result.id));
}