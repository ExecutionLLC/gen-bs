"use strict";

const ChangeCaseUtil = require('./utils/ChangeCaseUtil');

function addColumnToFilterText(knex, Promise) {
    return knex.raw('ALTER TABLE filter_text ADD COLUMN name character varying(50) NOT NULL DEFAULT \'\'');
}

function moveFilterNamesIntoNewColumn(knex, Promise) {
    console.log('=> Move filter names to filter_text table');
    return knex('filter')
        .select('id', 'name')
        .then((filterNames) => ChangeCaseUtil.convertKeysToCamelCase(filterNames))
        .then((filterNames) => Promise.all(filterNames.map(
            (filterName) => knex('filter_text')
                .where('filter_id', filterName.id)
                .update({
                    name: filterName.name
                })
            )
        ));
}

function dropFilterIsCopyDisableColumnNameColumn(knex, Promise) {
    return knex.schema.table('filter', (table) => {
            table.dropColumn('is_copy_disabled');
        });
}

function dropFilterColumn(knex, Promise) {
    return knex.schema
        .table('filter', (table) => {
            table.dropColumn('name');
        });
}

function dropDefaultFilterTextNameColumn(knex, Promise) {
    return knex.raw('ALTER TABLE filter_text ALTER COLUMN name DROP DEFAULT');
}

exports.up = function (knex, Promise) {
    console.log('Moving filter names to filter_text');
    return addColumnToFilterText(knex, Promise)
        .then(() => moveFilterNamesIntoNewColumn(knex, Promise))
        .then(() => dropDefaultFilterTextNameColumn(knex, Promise))
        .then(() => dropFilterColumn(knex, Promise))
        .then(() => dropFilterIsCopyDisableColumnNameColumn(knex, Promise))
        .then(() => console.log('=> Complete'));
};

exports.down = function (knex, Promise) {
    throw new Error('Not implemented');
};
