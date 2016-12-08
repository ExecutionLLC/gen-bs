const _ = require('lodash');
const Uuid = require('node-uuid');
const BluebirdPromise = require('bluebird');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const tables = {
    ViewVersion: 'view_version',
    View: 'view',
    ViewText: 'view_text',
    ViewItem: 'view_item',
    Analysis: 'analysis'
};

exports.up = function(knex) {
    console.log('=> Update view schema...');
    return createViewVersionsTable(knex)
        .then(() => appendAnalysesFieldViewVersion(knex))
        .then(() => appendViewItemFieldViewVersion(knex))
        .then(() => findViews(knex))
        .then((views) => {
            return BluebirdPromise.mapSeries(views, view => addViews(view, knex))
                .then(() => deleteRemovedViews(views, knex));
        })
        .then(() => removeAnalysesViewRef(knex))
        .then(() => removeViewItemViewRef(knex))
        .then(() => deleteVersionsFromViewTable(knex))
        .then(() => removeOldViewsColumns(knex));
};

exports.down = function() {
    throw new Error('Not implemented');
};

function removeAnalysesViewRef(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.dropColumn('view_id');
    });
}

function removeViewItemViewRef(knex) {
    return knex.schema.table(tables.ViewItem, (table) => {
        table.dropColumn('view_id');
    });
}

function removeOldViewsColumns(knex) {
    return knex.schema.table(tables.View, (table) => {
        table.dropColumn('original_view_id');
    });
}

function deleteVersionsFromViewTable(knex) {
    return findViews(knex)
        .then((filters) => {
            const deletingViews = _.filter(filters, filter => !_.isNull(filter.originalViewId));
            const deleteViewsIds = _.map(deletingViews, filter => filter.id);
            return knex(tables.ViewText)
                .whereIn('view_id', deleteViewsIds)
                .del()
                .then(() => knex(tables.View)
                    .whereNotNull('original_view_id')
                    .del()
                );
        });
}

function deleteRemovedViews(views, knex) {
    const deletedViews = _.filter(views, view => view.isDeleted && !_.isNull(view.originalViewId));
    return BluebirdPromise.mapSeries(deletedViews, view => deleteView(view, knex));
}

function deleteView(view, knex) {
    const {originalViewId, isDeleted} = view;
    return knex(tables.View)
        .where('id', originalViewId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            isDeleted
        }));
}

function createViewVersionsTable(knex) {
    return knex.schema.createTable(tables.ViewVersion, (table) => {
        table.uuid('id')
            .primary();
        table.uuid('view_id')
            .notNullable()
            .references('id')
            .inTable(tables.View);
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
}

function appendAnalysesFieldViewVersion(knex) {
    return knex.schema.table(tables.Analysis, (table) => {
        table.uuid('view_version_id')
            .references('id')
            .inTable(tables.ViewVersion);
    });
}

function appendViewItemFieldViewVersion(knex) {
    return knex.schema.table(tables.ViewItem, (table) => {
        table.uuid('view_version_id')
            .references('id')
            .inTable(tables.ViewVersion);
    });
}

function findViews(knex) {
    return knex.select()
        .from(tables.View)
        .orderBy('timestamp', 'asc')
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
}

function addViews(view, knex) {
    const {id, originalViewId, timestamp} = view;
    const viewVersion = {
        viewId: originalViewId || id,
        created: timestamp
    };
    return addViewVersion(viewVersion, knex)
        .then((viewVersionId) => updateAnalyses(id, viewVersionId, knex)
            .then(() => updateViewItems(id, viewVersionId, knex)));
}

function addViewVersion(viewVersion, knex) {
    const {id, viewId, created} = viewVersion;
    const newId = id || Uuid.v4();
    return knex(tables.ViewVersion)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            viewId,
            created,
            id: newId
        }))
        .then(() => newId);
}

function updateAnalyses(viewId, viewVersionId, knex) {
    return knex(tables.Analysis)
        .where('view_id', viewId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            viewVersionId
        }));
}

function updateViewItems(viewId, viewVersionId, knex) {
    return knex(tables.ViewItem)
        .where('view_id', viewId)
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            viewVersionId
        }));
}