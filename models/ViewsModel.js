'use strict';

const _ = require('lodash');
const async = require('async');

const SecureModelBase = require('./SecureModelBase');

const mappedColumns = ['id', 'name', 'description', 'is_disabled_4copy'];

class ViewsModel extends SecureModelBase {
    constructor(models) {
        super(models, 'view', mappedColumns);
    }

    add(userId, languId, view, callback) {
        let _view = this._init(userId, languId, view);

        this.db.knex.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(_view, trx, cb);
                },
                (viewId, cb) => {
                    const dataToInsert = {
                        viewId: viewId,
                        languId: languId,
                        description: _view.description
                    };
                    this._insertViewText(dataToInsert, trx, (error) => {
                        cb(error, viewId);
                    });
                },
                (viewId, cb) => {
                    this._addViewItems(viewId, _view.viewListItems, trx, (error) => {
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
                let _view = view;
                _view.originalViewId = viewData.originalViewId || viewData.id;
                this._add(userId, viewData.langu_id, _view, callback);
            }
        });
    }

    find(userId, viewId, callback) {
        this._fetch(userId, viewId, (error, viewData) => {
            if (error) {
                callback(error);
            } else {
                this._fetchViewItems(viewId, (error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, this._compileView(viewData, viewItemsData));
                    }
                });
            }
        });
    }

    // Собирает последние версии каждого view для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserViews(userId, (error, viewsData) => {
            if (error) {
                callback(error);
            } else {
                const viewIds = _.pluck(viewsData, 'id');
                this._fetchViewItemsByIds(viewIds, (error, viewItemsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        const viewItems = _.groupBy(viewItemsData, (viewItem) => {
                            return viewItem.view_id;
                        });
                        callback(null, this._compileViews(viewsData, viewItems));
                    }
                });
            }
        });
    }

    _init(userId, languId, data) {
        let _data = super._init(userId, languId, data);
        if (data.originalViewId) {
            _data.originalViewId = data.originalViewId;
        }
        _data.name =  data.name;
        _data.viewType = 'user';
        _data.viewListItems = data.viewListItems;
        return _data;
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

    _compileViews(viewsData, viewItemsData) {
        return _.map(viewsData, (viewData) => {
            return this._compileView(viewData, viewItemsData[viewData.id]);
        });
    }

    _compileView(viewData, viewItemsData) {
        let view = super._toJson(viewData);
        view['view_list_items'] = this._compileViewItems(viewItemsData);
        return view;
    }

    _compileViewItems(viewItemsData) {
        return _.map(viewItemsData, (viewItemData) => {
            return this._compileViewItem(viewItemData);
        });
    }

    _compileViewItem(viewItemData) {
        let viewItem = _.reduce(this.mappedColumns.viewItem, (memo, column) => {
            memo[column] = viewItemData[column];
            return memo;
        }, {});
        //viewItem['keywords'] = _compileViewItemKeywords();
        return viewItem;
    }

    _addViewItems(viewId, viewItems, trx) {
        let viewItemIds = [];
        async.map(viewItems, (item, cb) => {
            this.models.viewItems._insert(item, trx, (error, viewItemId) => {
                if (error) {
                    cb(error);
                } else {
                    viewItemIds.push(viewItemId);
                    cb(null, viewItemId);
                }
            });
        }, callback(error, viewItemIds));
    }

    _fetch(userId, id, callback) {
        super._fetchView(id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchView(viewId, callback) {
        this.db.knex.select()
            .from(this.baseTable)
            .innerJoin('view_text', 'view_text.view_id', 'view.id')
            .where('id', viewId)
            .exec((error, viewData) => {
                if (error) {
                    callback(error);
                } else {
                    if (viewData.length > 0) {
                        callback(null, viewData[0]);
                    } else {
                        callback(new Error('Item not found: ' + viewId));
                    }
                }
            });
    }

    _fetchUserViews(userId, callback) {
        const _query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_view_id isnull THEN id ELSE original_view_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTable + ' ' +
            'INNER JOIN view_text ON view_text.view_id = view.id ' +
            'WHERE creator = \'' + userId + '\' AND is_deleted = false) T WHERE T.RN = 1';
        this.db.knex.raw(_query)
            .exec(callback((error, viewsData) => {
                callback(error, viewsData.rows);
            }));
    }

    _fetchViewItemsByIds(viewIds, callback) {
        this.db.knex.select()
            .from('view_item')
            .whereIn('view_id', viewIds)
            .orderBy('view_id', 'asc')
            .exec(callback);
    }

    _fetchViewItems(viewId, callback) {
        this.db.knex.select()
            .from('view_item')
            .where('view_id', viewId)
            .orderBy('order', 'asc')
            .exec(callback);
    }
}

module.exports = ViewsModel;
