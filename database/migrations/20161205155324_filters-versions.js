const _ = require('lodash');
const Uuid = require('node-uuid');
const BluebirdPromise = require('bluebird');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const tables = {
    FilterVersion: 'filter_version',
    Filter: 'filter',
    FilterText: 'filter_text',
    Analysis: 'analysis'
};


exports.up = function (knex) {
    console.log('=> Update filters schema...');
    return createFilterVersionsTable(knex)
        .then(() => appendAnalysesFieldFilterVersion(knex))
        .then(() => findFilters(knex))
        .then((filters) => BluebirdPromise.mapSeries(filters, filter => addFilters(filter, knex)))
        .then(() => removeAnalysesFilterRef(knex))
        .then(() => deleteVersionsFromFilterTable(knex));
};

exports.down = function (knex, Promise) {

};

function addFilters(filter, knex) {
    const {id, originalFilterId, rules, timestamp} =filter;
    const filterVersion = {
        filterId: originalFilterId ? originalFilterId : id,
        rules,
        created: timestamp
    };
    return addFilterVersion(filterVersion, knex)
        .then((filerVersionId) => updateAnalyses(id, filerVersionId, knex));
}

function updateAnalyses(filterId, filterVersionId, knex) {
    return knex(tables.Analysis)
        .where('filter_id', filterId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            filterVersionId
        }));
}

function createFilterVersionsTable(knex) {
    return knex.schema.createTable(tables.FilterVersion, (table) => {
        table.uuid('id')
            .primary();
        table.uuid('filter_id')
            .notNullable()
            .references('id')
            .inTable(tables.Filter);
        table.json('rules');
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
}

function appendAnalysesFieldFilterVersion(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.uuid('filter_version_id')
            .references('id')
            .inTable(tables.FilterVersion);
    });
}

function removeAnalysesFilterRef(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.dropColumn('filter_id');
    })
}

function deleteVersionsFromFilterTable(knex) {
    return findFilters(knex)
        .then((filters) => {
            const deletingFilters = _.filter(filters, filter => !_.isNull(filter.originalFilterId));
            const deleteFiltersIds = _.map(deletingFilters, filter => filter.id);
            return knex(tables.FilterText)
                .whereIn('filter_id', deleteFiltersIds)
                .del()
                .then(() => knex(tables.Filter)
                    .whereNotNull('original_filter_id')
                    .del()
                );
        })
}

function findFilters(knex) {
    return knex.select()
        .from(tables.Filter)
        .orderBy('timestamp', 'asc')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function addFilterVersion(filterVersion, knex) {
    const {id, filterId, rules, created} = filterVersion;
    const newId = id ? id : Uuid.v4();
    return knex(tables.FilterVersion)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            filterId,
            rules,
            created,
            id: newId
        }))
        .then(() => newId);
}