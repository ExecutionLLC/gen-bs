'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'original_view_id',
    'name',
    'view_type',
    'is_deleted',
    'langu_id',
    'description',
    'view_list_items'
];

class ViewsModel extends SecureModelBase {
    constructor(models) {
        super(models, 'view', mappedColumns);
    }

    add(userId, languId, view, callback) {
        let viewData = this._init(userId, languId, view);

        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(viewData, trx, cb);
                },
                (viewId, cb) => {
                    const viewTextData = {
                        viewId: viewId,
                        languId: languId,
                        description: viewData.description
                    };
                    this._insertViewText(viewTextData, trx, (error) => {
                        cb(error, viewId);
                    });
                },
                (viewId, cb) => {
                    this._addViewItems(viewId, view.viewListItems, trx, (error) => {
                        cb(error, viewId);
                    });
                }
            ], cb);
        }, callback);
    }

    // Создаёт новую версию существующего view
    update(userId, viewId, view, callback) {
        this._fetch(userId, viewId, (error, viewData) => {
            if (error) {
                callback(error);
            } else {
                let newView = view;
                newView.originalViewId = viewData.originalViewId || viewData.id;
                this.add(userId, viewData.languId, newView, callback);
            }
        });
    }

    _init(userId, languId, data) {
        let result = super._init(userId, languId, data);
        if (data.originalViewId) {
            result.originalViewId = data.originalViewId;
        }
        result.name =  data.name;
        result.viewType = 'user';
        result.viewListItems = data.viewListItems;
        return result;
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            creator: data.creator,
            name: data.name,
            viewType: data.viewType
        }
        if (data.originalViewId) {
            dataToInsert.originalViewId = data.originalViewId
        }
        super._insert(dataToInsert, trx, callback);
    }

    _insertViewText(data, trx, callback) {
        this._insertTable('view_text', data, trx, callback);
    }

    _addViewItems(viewId, viewItems, trx, callback) {
        async.map(viewItems, (viewItem, cb) => {
            this._addViewItem(viewId, viewItem, trx, cb);
        }, callback);
    }

    _addViewItem(viewId, viewItem, trx, callback) {
        const dataToInsert = {
            id: viewItem.id,
            viewId: viewId,
            order: viewItem.order,
            sortOrder: viewItem.sort_order,
            sortDirection: viewItem.sortDirection
        };
        this._insertTable('view_item', dataToInsert, trx, (error, viewItemId) => {
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
        async.map(keywords, (keyword, cb) => {
            this._addKeyword(viewItemId, keyword.id, trx, cb);
        }, callback);
    }

    _addKeyword(viewItemId, keywordId, trx, callback) {
        const dataToInsert = {
            viewItemId: viewItemId,
            keywordId: keywordId
        };
        this._insertTable('view_item_keyword', dataToInsert, trx, callback);
    }

    _fetch(userId, id, callback) {
        this._fetchView(id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchView(viewId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTable)
            .innerJoin('view_text', 'view_text.view_id', this.baseTable + '.id')
            .where('id', viewId)
            .asCallback((error, viewData) => {
                if (error) {
                    cb(error);
                } else {
                    if (viewData.length > 0) {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(viewData[0]));
                    } else {
                        cb(new Error('Item not found: ' + viewId));
                    }
                }
            });
        }, callback);
    }

    _fetchUserViews(userId, callback) {
        const query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_view_id isnull THEN id ELSE original_view_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTable + ' ' +
            'INNER JOIN view_text ON view_text.view_id = ' + this.baseTable + '.id ' +
            'WHERE creator = \'' + userId + '\' AND is_deleted = false) T WHERE T.RN = 1';
        this.db.asCallback((knex, cb) => {
            knex.raw(query)
                .asCallback((error, viewsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(viewsData));
                    }
            });
        }, callback);
    }

    find(userId, viewId, callback) {
        let view;
        async.waterfall([
            (cb) => { this._fetch(userId, viewId, cb); },
            (viewData, cb) => {
                view = viewData;
                this._fetchViewItems(viewId, cb);
            },
            (viewItems, cb) => {
                this._compileView(view, viewItems, cb);
            }
        ], callback);
    }

    _compileView(view, viewItems, callback) {
        let viewData = view;
        this._mapViewItems(viewItems, (error, viewItemsData) => {
            if (error) {
                callback(error);
            } else {
                viewData.viewListItems = viewItemsData;
                callback(null, this._toJson(viewData));
            }
        });
    }

    // Собирает последние версии каждого view для текущего пользователя
    findAll(userId, callback) {
        async.waterfall([
            (cb) => { this._fetchUserViews(userId, cb); },
            (viewsData, cb) => {
                const viewIds = _.pluck(viewsData, 'id');
                this._fetchViewItemsByIds(viewIds, cb);
            },
            (viewItemsData, cb) => {
                const viewItems = _.groupBy(viewItemsData, (viewItem) => {
                    return viewItem.viewId;
                });
                async.map(viewsData, (viewData, cbk) => {
                    this._compileView(viewData, viewItems[viewData.id], cbk);
                }, cb);
            }
        ], callback);
    }

    _mapViewItems(viewItems, callback) {
        async.map(viewItems, (viewItem, cb) => {
            this._fetchViewItemKeywords(viewItem.id, (error, keywords) => {
                if (error) {
                    cb(error);
                } else {
                    this._mapKeywords(keywords, (error, result) => {
                        if (error) {
                            cb(error);
                        } else {
                            viewItem.keywords = result;
                            cb(null, viewItem);
                        }
                    });
                }
            });
        }, callback);
    }

    _mapKeywords(keywords, callback) {
        async.map(keywords, (keyword, cb) => {
            this.models.keywords.fetchKeywordSynonyms(keyword.id, (error, synonyms) => {
                if (error) {
                    cb(error);
                } else {
                    keyword.synonyms = synonyms;
                    cb(null, keyword);
                }
            });
        }, callback);
    }

    _fetchViewItemKeywords(viewItemId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('view_item')
                .innerJoin('view_item_keyword', 'view_item_keyword.view_item_id', 'view_item.id')
                .innerJoin('keyword', 'view_item_keyword.keyword_id', 'keyword.id')
                .where('view_item_id', viewItemId)
                .asCallback((error, keywords) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(keywords));
                    }
                });
        }, callback);
    }

    _fetchViewItemsByIds(viewIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('view_item')
                .whereIn('view_id', viewIds)
                .asCallback((error, viewItemsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(viewItemsData));
                    }
                });
        }, callback);
    }

    _fetchViewItems(viewId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('view_item')
                .where('view_id', viewId)
                .asCallback((error, viewItemsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(viewItemsData));
                    }
                });
        }, callback);
    }
}

module.exports = ViewsModel;