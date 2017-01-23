const _ = require('lodash');
const BluebirdPromise = require('bluebird');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

exports.up = function (knex) {
    return editFilterLanguageNotNullConstrains(knex)
        .then(() => editModelLanguageNotNullConstrains(knex))
        .then(() => editViewTextTable(knex))
        .then(() => editAnalysisTable(knex))
        .then(() => updateUserFilters(knex))
        .then(() => updateUserModels(knex))
        .then(() => updateUserViews(knex))
        .then(() => updateCommentTexs(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function updateCommentTexs(knex) {
    console.log('=> Update comments...');
    return knex.raw('ALTER TABLE comment_text ALTER COLUMN language_id DROP NOT NULL')
        .then(() => knex('comment_text')
            .whereNotNull('language_id')
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                languageId: null
            }))
        );
}

function updateUserFilters(knex) {
    return knex.select('id')
        .from('filter')
        .where('type', 'user')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
        .then((filters) => {
            return BluebirdPromise.mapSeries(filters, filter => {
                return knex('filter_text')
                    .where('filter_id', filter.id)
                    .update(ChangeCaseUtil.convertKeysToSnakeCase({
                        languageId: null
                    }));
            });
        });
}

function updateUserModels(knex) {
    return knex.select('id')
        .from('model')
        .where('type', 'user')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
        .then((models) => {
            return BluebirdPromise.mapSeries(models, model => {
                return knex('model_text')
                    .where('model_id', model.id)
                    .update(ChangeCaseUtil.convertKeysToSnakeCase({
                        languageId: null
                    }));
            });
        });
}

function updateUserViews(knex) {
    return knex.select('id')
        .from('view')
        .where('type', 'user')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
        .then((views) => {
            return BluebirdPromise.mapSeries(views, view => {
                return knex('view_text')
                    .where('view_id', view.id)
                    .update(ChangeCaseUtil.convertKeysToSnakeCase({
                        languageId: null
                    }));
            });
        });
}

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

function editAnalysisTable(knex) {
    console.log('=> Update analysis language constrains...');
    return knex.schema
        .table('analysis_text', table => {
            table.dropPrimary('analysis_text_pkey')
        })
        .then(() => knex.raw('ALTER TABLE analysis_text ALTER COLUMN language_id DROP NOT NULL'))
        .then(() => knex.schema
            .table('analysis_text', table => {
                table.unique(['analysis_id', 'language_id']);
            })
        )
        .then(() => knex('analysis_text')
            .whereNotNull('language_id')
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                languageId: null
            })));
}

function editViewTextTable(knex) {
    return addViewTextNameColumn(knex)
        .then(() => findViews(knex))
        .then((views) => {
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