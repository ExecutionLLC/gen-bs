'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

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
        async.waterfall([
            (callback) => { this._fetch(userId, viewId, callback); },
            (view, callback) => {
                this._fetchViewItems(viewId, (error, viewItems) => {
                    if (error) {
                        callback(error);
                    } else {
                        this._mapView(view, viewItems, callback);
                    }
                });
            }
        ], callback);
    }

    // It collects the latest version of each view for the current user
    findAll(userId, callback) {
        async.waterfall([
            (callback) => { this._fetchUserViews(userId, callback); },
            (viewsData, callback) => {
                const viewIds = _.pluck(viewsData, 'id');
                this._fetchViewItemsByIds(viewIds, (error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        let viewItems = _.groupBy(viewItemsData, (viewItem) => {
                            return viewItem.viewId;
                        });
                        async.map(viewsData, (viewData, callback) => {
                            this._mapView(viewData, viewItems[viewData.id], callback);
                        }, callback);
                    }
                });
            }
        ], callback);
    }

    findMany(userId, viewIds, callback) {
        async.waterfall([
            (callback) => { this._fetchViews(viewIds, callback); },
            (views, callback) => {
                if (views.length == viewIds.length) {
                    callback(null, views);
                } else {
                    callback('Some views not found: ' + viewIds + ', userId: ' + userId);
                }
            },
            (views, callback) => {
                if (_.every(views, 'creator', userId)) {
                    callback(null, views);
                } else {
                    callback('Unauthorized access to views: ' + viewIds + ', userId: ' + userId);
                }
            },
            (views, callback) => {
                this._fetchViewItemsByIds(viewIds, (error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        let viewItems = _.groupBy(viewItemsData, (viewItem) => {
                            return viewItem.viewId;
                        });
                        async.map(views, (view, callback) => {
                            this._mapView(viewData, viewItems[view.id], callback);
                        }, callback);
                    }
                });
            }
        ], callback);
    }

    _add(userId, languId, view, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : view.id,
                        creator: userId,
                        name: view.name,
                        type: view.type || 'user'
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
        const dataToInsert = {
            id: this._generateId(),
            viewId: viewId,
            fieldId: viewItem.fieldId,
            order: viewItem.order,
            sortOrder: viewItem.sortOrder,
            sortDirection: viewItem.sortDirection,
            filterControlEnable: viewItem.filterControlEnable || false
        };
        this._unsafeInsert('view_item', dataToInsert, trx, (error, viewItemId) => {
            if (error) {
                callback(error);
            } else {
                this._addKeywords(viewItemId, viewItem.keywords, trx, (error) => {
                    callback(error, viewItemId);
                });
            }
        });
    }

    _addKeywords(viewItemId, keywords, trx, callback) {
        async.map(keywords, (keyword, callback) => {
            this._addKeyword(viewItemId, keyword.id, trx, callback);
        }, callback);
    }

    _addKeyword(viewItemId, keywordId, trx, callback) {
        const dataToInsert = {
            viewItemId: viewItemId,
            keywordId: keywordId
        };
        this._unsafeInsert('view_item_keyword', dataToInsert, trx, callback);
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
                    this._unsafeInsert('view_text', dataToInsert, trx, (error) => {
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
        this._fetchView(viewId, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
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

    _fetchViews(viewIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('view_text', 'view_text.view_id', this.baseTableName + '.id')
                .whereIn('id', viewIds)
                .asCallback((error, viewsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(viewsData));
                    }
                });
        }, callback);
    }

    _fetchUserViews(userId, callback) {
        const query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_view_id isnull THEN id ELSE original_view_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTableName + ' ' +
            'INNER JOIN view_text ON view_text.view_id = ' + this.baseTableName + '.id ' +
            'WHERE (creator = \'' + userId + '\' OR creator IS NULL) AND is_deleted = false) T WHERE T.RN = 1';
        this.db.asCallback((knex, callback) => {
            knex.raw(query)
                .asCallback((error, viewsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(viewsData.rows));
                    }
            });
        }, callback);
    }

    _mapView(view, viewItems, callback) {
        this._mapViewItems(viewItems, (error, viewItemsData) => {
            if (error) {
                callback(error);
            } else {
                view.viewListItems = viewItemsData;
                callback(null, this._mapColumns(view));
            }
        });
    }

    _mapViewItems(viewItems, callback) {
        async.map(viewItems, (viewItem, callback) => {
            this._fetchViewItemKeywords(viewItem.id, (error, keywords) => {
                if (error) {
                    callback(error);
                } else {
                    this._mapKeywords(keywords, (error, result) => {
                        if (error) {
                            callback(error);
                        } else {
                            viewItem.keywords = result;
                            callback(null, viewItem);
                        }
                    });
                }
            });
        }, callback);
    }

    _mapKeywords(keywords, callback) {
        async.map(keywords, (keyword, callback) => {
            this.models.keywords.fetchKeywordSynonyms(keyword.id, (error, synonyms) => {
                if (error) {
                    callback(error);
                } else {
                    keyword.synonyms = synonyms;
                    callback(null, keyword);
                }
            });
        }, callback);
    }

    _fetchViewItemKeywords(viewItemId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('view_item')
                .innerJoin('view_item_keyword', 'view_item_keyword.view_item_id', 'view_item.id')
                .innerJoin('keyword', 'view_item_keyword.keyword_id', 'keyword.id')
                .where('view_item_id', viewItemId)
                .asCallback((error, keywords) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(keywords));
                    }
                });
        }, callback);
    }

    _fetchViewItemsByIds(viewIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('view_item')
                .whereIn('view_id', viewIds)
                .asCallback((error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(viewItemsData));
                    }
                });
        }, callback);
    }

    _fetchViewItems(viewId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('view_item')
                .where('view_id', viewId)
                .asCallback((error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(viewItemsData));
                    }
                });
        }, callback);
    }
}

module.exports = ViewsModel;