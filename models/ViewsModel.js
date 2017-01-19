'use strict';

const _ = require('lodash');
const async = require('async');
const knex = require('knex');

const {ENTITY_TYPES} = require('../utils/Enums');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Views: 'view',
    ViewItems: 'view_item',
    ViewTexts: 'view_text',
    ViewVersions: 'view_version',
    ViewItemKeywords: 'view_item_keyword'
};

const mappedColumns = [
    'id',
    'originalViewId',
    'name',
    'type',
    'isDeleted',
    'isCopyDisabled',
    'languageId',
    'description',
    'viewListItems'
];

class ViewsModel extends SecureModelBase {
    constructor(models) {
        super(models, 'view', mappedColumns);
    }

    find(userId, viewId, callback) {
        const viewIds = [viewId];
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findViews(trx, viewIds, userId, false, false, callback),
                (views, callback) => callback(null, _.first(views))
            ], (error, view) => {
                callback(error, view);
            });
        }, callback);
    }

    // It collects the latest version of each view for the current user
    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findViews(trx, null, userId, true, true, callback);
        }, callback);
    }

    findMany(userId, viewIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findViews(trx, viewIds, userId, false, false, callback);
        }, callback);
    }

    _add(userId, languageId, view, shouldGenerateId, callback) {
        const viewText = _.find(view.text, text => _.isNull(text.languageId));
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureNameIsValid(viewText.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        type: view.type || ENTITY_TYPES.USER
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (viewId, callback) => {
                    const dataToInsert = {
                        viewId: viewId,
                        languageId: viewText.languageId,
                        name: viewText.name.trim(),
                        description: viewText.description
                    };
                    this._unsafeInsert('view_text', dataToInsert, trx, (error) => {
                        callback(error, viewId);
                    });
                },
                (viewId, callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : view.id,
                        viewId: viewId
                    };
                    this._unsafeInsert(TableNames.ViewVersions, dataToInsert, trx, callback);
                },
                (viewVersionId, callback) => {
                    this._addViewItems(viewVersionId, view.viewListItems, trx, (error) => {
                        callback(error, viewVersionId);
                    });
                }
            ], callback);
        }, callback);
    }

    _addViewItems(viewVersionId, viewItems, trx, callback) {
        async.map(viewItems, (viewItem, callback) => {
            this._addViewItem(viewVersionId, viewItem, trx, callback);
        }, callback);
    }

    _addViewItem(viewVersionId, viewItem, trx, callback) {
        async.waterfall([
            (callback) => {
                if (!viewItem.fieldId){
                    callback(new Error('Can\'t add view item with no field id'));
                } else {
                    const dataToInsert = {
                        id: this._generateId(),
                        viewVersionId: viewVersionId,
                        fieldId: viewItem.fieldId,
                        order: viewItem.order,
                        sortOrder: viewItem.sortOrder,
                        sortDirection: viewItem.sortDirection,
                        filterControlEnable: viewItem.filterControlEnable || false
                    };
                    this._unsafeInsert(TableNames.ViewItems, dataToInsert, trx, callback);
                }
            },
            (viewItemId, callback) => {
                this._addKeywords(viewItemId, viewItem.keywords, trx, (error) => {
                    callback(error, viewItemId);
                });
            }
        ], callback);
    }

    _addKeywords(viewItemId, keywordIds, trx, callback) {
        async.map(keywordIds, (keywordId, callback) => {
            this._addKeyword(viewItemId, keywordId, trx, callback);
        }, callback);
    }

    _addKeyword(viewItemId, keywordId, trx, callback) {
        const dataToInsert = {
            viewItemId: viewItemId,
            keywordId: keywordId
        };
        this._unsafeInsert(TableNames.ViewItemKeywords, dataToInsert, trx, callback);
    }

    // Creates a new version of an existing view
    _update(userId, view, viewToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        viewId: viewToUpdate.viewId
                    };
                    this._unsafeInsert(TableNames.ViewVersions, dataToInsert,trx, callback);
                },
                (viewVersionId, callback) => {
                    this._addViewItems(viewVersionId, viewToUpdate.viewListItems, trx, (error) => {
                        callback(error, viewVersionId);
                    });
                }
            ], callback);
        }, callback);
    }

    _fetch(userId, viewId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchView(userId, viewId, callback);
            },
            (view, callback) => {
                this._checkUserIsCorrect(userId, view, callback);
            }
        ], callback);
    }

    _fetchView(userId, viewId, callback) {
        this.db.asCallback((trx, callback) => {
            async.waterfall([
                (callback) => this._findViews(trx, [viewId], userId, false, false, callback),
                (views) => {
                    if (!views.length) {
                        callback(new Error('Item not found: ' + viewId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(views[0]));
                    }
                }
            ], callback);
        }, callback);
    }

    _findViews(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findViewsMetadata(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (viewsMetadata, callback) => {
                const viewVersionIds = _.map(viewsMetadata, view => view.id);
                this._attachListItems(trx, viewsMetadata, viewVersionIds, (error, views) => {
                    callback(error, views);
                });
            },
            (views, callback) => {
                const viewIds = _.map(views, view => view.viewId);
                this._attachViewsDescriptions(trx, views, viewIds, callback);
            }
        ], (error, views) => {
            callback(error, views);
        });
    }

    _findViewsMetadata(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        let query = trx.select([
            `${TableNames.ViewVersions}.id`,
            `${TableNames.ViewVersions}.created`,
            `${TableNames.ViewVersions}.view_id`,
            `${TableNames.Views}.type`,
            `${TableNames.Views}.is_deleted`,
            `${TableNames.Views}.is_copy_disabled`,
            `${TableNames.Views}.creator`
        ])
            .from(TableNames.ViewVersions)
            .leftJoin(TableNames.Views,`${TableNames.ViewVersions}.view_id`,`${TableNames.Views}.id`)
            .whereRaw('1 = 1');

        if (userIdOrNull) {
            query = query.andWhere(function () {
                this.whereNull('creator')
                    .orWhere('creator', userIdOrNull);
            });
        } else {
            query = query.andWhere('creator', null);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (viewIdsOrNull) {
            query = query.andWhere(`${TableNames.ViewVersions}.id`, 'in', viewIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (views, callback) => this._toCamelCase(views, callback),
            (views, callback) => {
                if (includeLastVersionsOnly) {
                    this._getLastViewVersions(views, callback);
                } else {
                    callback(null, views)
                }
            },
            (views, callback) => {
                if (viewIdsOrNull) {
                    this._ensureAllItemsFound(views, viewIdsOrNull, callback);
                } else {
                    callback(null, views);
                }
            }
        ], callback);
    }

    _getLastViewVersions(views, callback) {
        const viewVersionGroup = _.groupBy(views, 'viewId');
        const lastVersions = _.map(viewVersionGroup, viewGroup => {
            const orderedViews = _.orderBy(viewGroup, ['created'], ['desc']);
            return _.head(orderedViews);
        });
        callback(null, lastVersions)
    }

    _attachListItems(trx, views, viewVersionIds, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(TableNames.ViewItems)
                    .whereIn('view_version_id', viewVersionIds)
                    .asCallback(callback);
            },
            (viewsItems, callback) => this._toCamelCase(viewsItems, callback),
            // Load keywords for the items.
            (viewsItems, callback) => this._attachKeywords(trx, viewsItems, callback),
            (viewsItems, callback) => {
                // Group items by view.
                const itemsByViewId = _.groupBy(viewsItems, viewItem => viewItem.viewVersionId);
                // Create a new views collection with view items attached.
                const viewsWithItems = _.map(views, view => {
                    return Object.assign({}, view, {
                        viewListItems: itemsByViewId[view.id]
                    });
                });
                callback(null, viewsWithItems);
            }
        ], callback);
    }

    _attachViewsDescriptions(trx, views, viewIds, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(TableNames.ViewTexts)
                    .whereIn('view_id', viewIds)
                    .asCallback(callback);
            },
            (viewsTexts, callback) => this._toCamelCase(viewsTexts, callback),
            (viewsTexts, callback) => {
                const textsHash = _.groupBy(viewsTexts, 'viewId');
                const viewsWithDescription = _.map(views, view => {
                    return Object.assign({}, view, {
                        text: _.map(textsHash[view.viewId], text => {
                            const {description, languageId, name} = text;
                            return {
                                name,
                                description,
                                languageId
                            };
                        })
                    });
                });
                callback(null, viewsWithDescription);
            }
        ], callback);
    }

    _attachKeywords(trx, viewItems, callback) {
        const viewItemIds = _.map(viewItems, item => item.id);
        async.waterfall([
            // Get list of (itemId, keywordId) pairs from database
            (callback) => {
                trx.select()
                    .from(TableNames.ViewItemKeywords)
                    .whereIn('view_item_id', viewItemIds)
                    .asCallback(callback)
            },
            (itemsKeywordIds, callback) => this._toCamelCase(itemsKeywordIds, callback),
            // Attach keywords to the corresponding items.
            (itemsKeywordIds, callback) => {
                // Group (itemId, keywordId) pairs by item id.
                const itemIdToKeywordIds = _.groupBy(itemsKeywordIds, itemKeywordId => itemKeywordId.viewItemId);
                // Create a new collection of view list items with keywords.
                const viewItemsWithKeywords = _.map(viewItems, viewItem => {
                    const itemKeywordIds = itemIdToKeywordIds[viewItem.id];
                    return Object.assign({}, viewItem, {
                        keywords: _.map(itemKeywordIds,itemKeywordId =>itemKeywordId.keywordId)
                    });
                });

                callback(null, viewItemsWithKeywords);
            }
        ], callback);
    }

    remove(userId, itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => this._remove(itemData.viewId, callback)
        ], callback);
    }

    _remove(itemId, callback) {
        this.db.transactionally((trx, callback) => {
            trx(TableNames.Views)
                .where('id', itemId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({isDeleted: true}))
                .asCallback((error) => {
                    callback(error, itemId);
                });
        }, callback);
    }
}

module.exports = ViewsModel;