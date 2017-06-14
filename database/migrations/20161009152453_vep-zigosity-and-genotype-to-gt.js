const Promise = require('bluebird');
const Uuid = require('node-uuid');
const _ = require('lodash');

const ChangeCaseUtil = require('./utils/ChangeCaseUtil');
const CollectionUtils = require('./utils/CollectionUtils');

const vepColumnsNames = ['VEP_Zygosity', 'VEP_Genotype'];
const vepPrefix = 'VEP_';
const gtPrefix = 'GT_GT_';
const fieldsTableNames = {
    Metadata: 'field_metadata',
    Text: 'field_text',
    AvailableValues: 'field_available_value',
    AvailableValuesText: 'field_available_value_text'
};

const viewTableNames = {
    Views: 'view',
    ViewItems: 'view_item',
    ViewTexts: 'view_text',
    ViewItemKeywords: 'view_item_keyword'
};

exports.up = function (knex) {
    console.log('==> VEP_Zygosity/Genotype ->> GT_Zygosity/Genotype...');
    return makeVepFieldsInvisible(knex)
        .then(() => updateVepViews(knex))
        .then(() => updateGtLabels(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function updateGtLabels(knex) {
    console.log('==> Update GT_Zygosity/Genotype labels...');
    return _findColumnByNames(knex, vepColumnsNames)
        .then((vepColumns) => Promise.map(vepColumns, (vepField)=> {
            return _findColumnByName(knex, vepField.name.replace(vepPrefix, gtPrefix))
                .then((gtField) => updateGtFieldsLabel(knex, gtField.id, vepField.label))
        }));
}

function updateGtFieldsLabel(knex, fieldId, label) {
    return knex(fieldsTableNames.Text)
        .where('field_id', fieldId)
        .update({
            label: label
        });
}

function makeVepFieldsInvisible(knex) {
    return Promise.map(vepColumnsNames, columnName => _makeVepFieldInvisible(knex, columnName));
}

function _makeVepFieldInvisible(knex, columnName) {
    console.log(columnName, '==> Make field invisible...');
    return knex(fieldsTableNames.Metadata)
        .where('name', columnName)
        .update({
            is_invisible: true
        });
}

function updateVepViews(knex) {
    console.log('==> Update Views...');
    return _findDefaultViews(knex)
        .then((defaultViews)=> {
            return _findColumnByNames(knex, vepColumnsNames)
                .then((vepColumns)=> {
                    return Promise.map(vepColumns, vepColumn => _findColumnByName(knex, vepColumn.name.replace(vepPrefix, gtPrefix))
                        .then((gtColumn) => ({
                            vepId: vepColumn.id,
                            gtId: gtColumn.id
                        }))
                    ).then((vepList) => {
                        const vepHash = _.keyBy(vepList, 'vepId');
                        const vepFieldIds = Object.keys(vepHash);
                        const vepViews = _.filter(defaultViews, view => {
                            return _.some(view.viewListItems, item => {
                                return _.some(vepFieldIds, vepField => vepField === item.fieldId)
                            });
                        });
                        return Promise.map(vepViews, vepView => {
                            const gtView = Object.assign({}, vepView, {
                                viewListItems: _.map(vepView.viewListItems, viewListItem => {
                                    const vepFieldId = viewListItem.fieldId;
                                    return Object.assign({}, viewListItem, {
                                        fieldId: _.some(vepFieldIds, vepField => vepField === vepFieldId) ? vepHash[vepFieldId].gtId : vepFieldId
                                    });
                                })
                            });
                            return updateView(knex, vepView, gtView)

                        })
                    });
                });
        });
}

function _findDefaultViews(knex) {
    return knex(viewTableNames.Views)
        .whereIn('type', ['default', 'standard', 'advanced'])
        .then((results) => ChangeCaseUtil.convertKeysToCamelCase(results))
        .then((viewsMetadata) => {
            const viewIds = _.map(viewsMetadata, view => view.id);
            return _attachListItems(knex, viewsMetadata, viewIds)
                .then((views) => attachViewsDescriptions(knex, views, viewIds));
        })
}

function updateView(knex, view, viewToUpdate) {
    const id = Uuid.v4();
    const insertedView = {
        id,
        creator: viewToUpdate.userId,
        name: viewToUpdate.name,
        type: view.type,
        originalViewId: view.originalViewId || view.id
    };
    return knex(viewTableNames.Views)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(insertedView))
        .then(() => {
            const insertedViewText = {
                viewId: id,
                languId: view.languId,
                description: viewToUpdate.description
            };
            return knex(viewTableNames.ViewTexts)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase(insertedViewText))
                .then(() => addViewItems(knex, id, viewToUpdate.viewListItems))
        })
}

function addViewItems(knex, viewId, viewListItems) {
    return Promise.map(viewListItems, viewListItem => addViewItem(knex, viewId, viewListItem))
}

function addViewItem(knex, viewId, viewItem) {
    const id = Uuid.v4();
    const insertedViewItem = {
        id,
        viewId: viewId,
        fieldId: viewItem.fieldId,
        order: viewItem.order,
        sortOrder: viewItem.sortOrder,
        sortDirection: viewItem.sortDirection,
        filterControlEnable: viewItem.filterControlEnable || false
    };
    return knex(viewTableNames.ViewItems)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(insertedViewItem))
        .then(() => addKeyWords(knex, id, viewItem.keywords))
}

function addKeyWords(knex, viewItemId, keywordIds) {
    return Promise.map(keywordIds, keywordId => addKeyword(knex, viewItemId, keywordId))
}

function addKeyword(knex, viewItemId, keywordId) {
    const insertKeyWord = {
        viewItemId: viewItemId,
        keywordId: keywordId
    };
    return knex(viewTableNames.ViewItemKeywords)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(insertKeyWord))
}

function attachViewsDescriptions(knex, views, viewIds) {
    return knex(viewTableNames.ViewTexts)
        .whereIn('view_id', viewIds)
        .then((viewsTexts) => ChangeCaseUtil.convertKeysToCamelCase(viewsTexts))
        .then((viewsTexts) => {
            const textsHash = CollectionUtils.createHashByKey(viewsTexts, 'viewId');
            return _.map(views, view => {
                return Object.assign({}, view, {
                    description: textsHash[view.id].description
                });
            })
        })
}

function _attachListItems(knex, views, viewIds) {
    return knex(viewTableNames.ViewItems)
        .whereIn('view_id', viewIds)
        .then((viewsItems) => ChangeCaseUtil.convertKeysToCamelCase(viewsItems))
        .then((viewsItems) => attachKeywords(knex, viewsItems))
        .then((viewsItems) => {
            // Group items by view.
            const itemsByViewId = _.groupBy(viewsItems, viewItem => viewItem.viewId);
            // Create a new views collection with view items attached.
            return _.map(views, view => {
                return Object.assign({}, view, {
                    viewListItems: itemsByViewId[view.id]
                });
            });
        })
}

function attachKeywords(knex, viewItems) {
    const viewItemIds = _.map(viewItems, item => item.id);
    return knex(viewTableNames.ViewItemKeywords)
        .whereIn('view_item_id', viewItemIds)
        .then((itemsKeywordIds) => ChangeCaseUtil.convertKeysToCamelCase(viewItems))
        .then((itemsKeywordIds) => {
            const itemIdToKeywordIds = _.groupBy(itemsKeywordIds, itemKeywordId => itemKeywordId.viewItemId);
            // Create a new collection of view list items with keywords.
            return _.map(viewItems, viewItem => {
                const itemKeywordIds = itemIdToKeywordIds[viewItem.id];
                return Object.assign({}, viewItem, {
                    keywords: _.map(itemKeywordIds, itemKeywordId =>itemKeywordId.keywordId)
                });
            })
        })
}

function _findColumnByName(knex, name) {
    return _fetchByName(knex, [name])
        .then((columns) => (columns[0]))
}

function _findColumnByNames(knex, names) {
    return _fetchByName(knex, names)
}

function _fetchByName(knex, names) {
    return knex(fieldsTableNames.Metadata)
        .innerJoin(fieldsTableNames.Text, `${fieldsTableNames.Text}.field_id`, `${fieldsTableNames.Metadata}.id`)
        .whereIn('name', names)
        .then((results) => ChangeCaseUtil.convertKeysToCamelCase(results))
}
