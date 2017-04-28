const _ = require('lodash');
const BluebirdPromise = require('bluebird');
const ChangeCaseUtil = require('./utils/ChangeCaseUtil');

const samplesTable = 'sample';
const ERROR_CODE = -500;

exports.up = function(knex) {
    console.log('Changing type of sample.error from CHARACTER VARYING to JSON');
    return editSamplesTable(knex);
};

exports.down = function() {
    throw new Error('Not implemented');
};

function editSamplesTable(knex) {
    return addSampleNewErrorColumn(knex)
        .then(() => findSamples(knex))
        .then((samples) => {
            return BluebirdPromise.mapSeries(samples, sample => {
                return updateSampleError(knex, sample);
            });
        })
        .then(() => dropSampleErrorColumn(knex));
}

function addSampleNewErrorColumn(knex) {
    return knex.schema
        .table(samplesTable, table => {
            table.json('error_new');
        });
}

function findSamples(knex) {
    return knex.select()
        .from(samplesTable)
        .whereNotNull('error')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function updateSampleError(knex, sample) {
    const {id, error} = sample;
    return knex(samplesTable)
        .where('id', id)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            error_new: JSON.stringify({
                code: ERROR_CODE,
                message: error
            })
        }));
}

function dropSampleErrorColumn(knex) {
    return knex.schema
        .table(samplesTable, table => {
            table.dropColumn('error');
            table.renameColumn('error_new', 'error');
        });
}
