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
    ViewVersions: 'view_versions',
    ViewItemKeywords: 'view_item_keyword'
};

const mappedColumns = [
    'id',
    'originalViewId',
    'name',
    'type',
    'isDeleted',
    'isCopyDisabled',
    'languId',
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

    _add(userId, languId, view, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureNameIsValid(view.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : view.id,
                        creator: userId,
                        name: view.name,
                        type: view.type || ENTITY_TYPES.USER
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (viewId, callback) => {
                    const dataToInsert = {
                        viewId: viewId,
                        languId: languId,
                        description: view.description
                    };
                    this._unsafeInsert('view_text', dataToInsert, trx, (error) => {
                        callback(error, viewId);
                    });
                },
                (viewId, callback) => {
                    this._addViewItems(viewId, view.viewListItems, trx, (error) => {
                        callback(error, viewId);
                    });
                }
            ], callback);
        }, callback);
    }

    _addViewItems(viewId, viewItems, trx, callback) {
        async.map(viewItems, (viewItem, callback) => {
            this._addViewItem(viewId, viewItem, trx, callback);
        }, callback);
    }

    _addViewItem(viewId, viewItem, trx, callback) {
        async.waterfall([
            (callback) => {
                if (!viewItem.fieldId){
                    callback(new Error('Can\'t add view item with no field id'));
                } else {
                    const dataToInsert = {
                        id: this._generateId(),
                        viewId: viewId,
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
                        creator: userId,
                        name: viewToUpdate.name,
                        type: view.type,
                        originalViewId: view.originalViewId || view.id
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (viewId, callback) => {
                    const dataToInsert = {
                        viewId: viewId,
                        languId: view.languId,
                        description: viewToUpdate.description
                    };
                    this._unsafeInsert(TableNames.ViewTexts, dataToInsert, trx, (error) => {
                        callback(error, viewId);
                    });
                },
                (viewId, callback) => {
                    this._addViewItems(viewId, viewToUpdate.viewListItems, trx, (error) => {
                        callback(error, viewId);
                    });
                }
            ], callback);
        }, callback);
    }

    _fetch(userId, viewId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchView(viewId, callback);
            },
            (view, callback) => {
                this._checkUserIsCorrect(userId, view, callback);
            }
        ], callback);
    }

    _fetchView(viewId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
            .from(this.baseTableName)
            .innerJoin('view_text', 'view_text.view_id', this.baseTableName + '.id')
            .where('id', viewId)
            .asCallback((error, viewData) => {
                if (error || !viewData.length) {
                    callback(error || new Error('Item not found: ' + viewId));
                } else {
                    callback(null, ChangeCaseUtil.convertKeysToCamelCase(viewData[0]));
                }
            });
        }, callback);
    }

    _findViews(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findViewsMetadata(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (viewsMetadata, callback) => {
                const viewIds = _.map(viewsMetadata, view => view.id);
                callback(null, viewsMetadata, viewIds);
            },
            (viewsMetadata, viewIds, callback) => {
                this._attachListItems(trx, viewsMetadata, viewIds, (error, views) => {
                    callback(error, views, viewIds);
                });
            },
            (views, viewIds, callback) => {
                this._attachViewsDescriptions(trx, views, viewIds, callback);
            }
        ], (error, views) => {
            callback(error, views);
        });
    }

    _findViewsMetadata(trx, viewIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        let query = trx.select()
            .from(TableNames.Views)
            .whereRaw('1 = 1');
        if (includeLastVersionsOnly) {
            const selectLastViewIds = 'SELECT' +
                '  T.id' +
                ' FROM (' +
                '  SELECT ROW_NUMBER() OVER (' +
                '    PARTITION BY CASE WHEN original_view_id isnull THEN id ELSE original_view_id END ORDER BY timestamp DESC' +
                '  ) AS RN,' +
                '  id' +
                '  FROM view' +
                ' ) AS T' +
                ' WHERE T.RN = 1';
            query = query.andWhereRaw('view.id IN (' + selectLastViewIds + ')');
        }

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
            query = query.andWhere('id', 'in', viewIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (views, callback) => this._toCamelCase(views, callback),
            (views, callback) => {
                if (viewIdsOrNull) {
                    this._ensureAllItemsFound(views, viewIdsOrNull, callback);
                } else {
                    callback(null, views);
                }
            }
        ], callback);
    }

    _attachListItems(trx, views, viewIds, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(TableNames.ViewItems)
                    .whereIn('view_id', viewIds)
                    .asCallback(callback);
            },
            (viewsItems, callback) => this._toCamelCase(viewsItems, callback),
            // Load keywords for the items.
            (viewsItems, callback) => this._attachKeywords(trx, viewsItems, callback),
            (viewsItems, callback) => {
                // Group items by view.
                const itemsByViewId = _.groupBy(viewsItems, viewItem => viewItem.viewId);
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
                const textsHash = CollectionUtils.createHashByKey(viewsTexts, 'viewId');
                const viewsWithDescription = _.map(views, view => {
                    return Object.assign({}, view, {
                        description: textsHash[view.id].description
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
}

module.exports = ViewsModel;