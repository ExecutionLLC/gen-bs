const _ = require('lodash');
const Uuid = require('node-uuid');
const BluebirdPromise = require('bluebird');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

exports.up = function (knex) {
    return editFilterLanguageNotNullConstrains(knex)
        .then(() => editModelLanguageNotNullConstrains(knex))
        .then(() => editViewTextTable(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function editFilterLanguageNotNullConstrains(knex) {
    console.log('=> Update filter language constrains...');
    return knex.schema
        .table('filter_text', table => {
            table.dropPrimary('filter_text_pkey')
        })
        .then(() => knex.raw('ALTER TABLE filter_text ALTER COLUMN language_id DROP NOT NULL'))
        .then(() => knex.schema
            .table('filter_text', table => {
                table.unique(['filter_id', 'language_id']);
            })
        );
}

function editModelLanguageNotNullConstrains(knex) {
    console.log('=> Update model language constrains...');
    return knex.schema
        .table('model_text', table => {
            table.dropPrimary('model_text_pkey')
        })
        .then(() => knex.raw('ALTER TABLE model_text ALTER COLUMN language_id DROP NOT NULL'))
        .then(() => knex.schema
            .table('model_text', table => {
                table.unique(['model_id', 'language_id']);
            })
        );
}

function editViewTextTable(knex) {
    return addViewTextNameColumn(knex)
        .then(() => findViews(knex))
        .then((views) => {
            console.log(views);
            return BluebirdPromise.mapSeries(views, view => {
                return updateViewName(knex, view);
            });
        })
        .then(() => dropViewNameColumn(knex));
}

function findViews(knex) {
    return knex.select()
        .from('view')
        .orderBy('timestamp', 'asc')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function addViewTextNameColumn(knex) {
    return knex.schema
        .table('view_text', table => {
            table.string('name', 50);
        })
}

function updateViewName(knex, view) {
    const {id, name} = view;
    return knex('view_text')
        .where('view_id', id)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            name
        }));
}

function dropViewNameColumn(knex) {
    return knex.schema
        .table('view', table => {
            table.dropColumn('name')
        });
}