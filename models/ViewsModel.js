'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = {
    view: ['id', 'name', 'description', 'is_disabled_4copy'],
    viewItem: ['id', 'order', 'sort_order', 'description']
};

class ViewsModel extends ModelBase {
    constructor(models) {
        super(models);
    }

    add(userId, languId, view, callback) {
        this.knex.transaction((trx) => {
                return this._addView(userId, view, trx)
                    .then((insertedView) => {
                        const viewId = insertedView.id;
                        return this._addViewDescription(viewId, languId, view.description, trx)
                            .then(() => {
                                return this._addViewItems(viewId, view.viewListItems, trx);
                            });
                    });
            })
            .then((res) => {
                callback(null, res);
            })
            .catch((error) => {
                callback(error)
            });
    }

    find(userId, viewId, callback) {
        this._getView(userId, viewId, (error, viewData) => {
            if (error) {
                callback(error);
            } else {
               this._getViewItems(viewId, (error, viewItemsData) => {
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
        this._getUserViews(userId, (error, viewsData) => {
            if (error) {
                callback(error);
            } else {
                const viewIds = _.pluck(viewsData, 'id');
                this._getViewItemsByIds(viewIds, (error, viewItemsData) => {
                    const viewItems = _.groupBy(viewItemsData, (viewItem) => {
                        return viewItem.view_id;
                    });

                    callback(null, this._compileViews(viewsData, viewItems));
                });
            }
        });
    }

    // Создаёт новую версию существующего view
    update(userId, viewId, view, callback) {
        this._getView(userId, viewId, (error, viewData) => {
            if (error) {
                callback(error);
            } else {
                view.originalViewId = viewData.original_view_id || viewData.id;
                thid.add(userId, viewData.langu_id, view, callback);
            }
        });
    }

    // Set is_deleted = true
    delete(userId, viewId, callback) {
        this.knex('view')
            .where('creator', userId)
            .andWhere('id', viewId)
            .update({
                is_deleted: true
            })
            .then(() => {
                callback(null, viewId);
            })
            .catch((error) => {
                callback(error)
            });
    }

    _compileViews(viewsData, viewItemsData) {
        return _.map(viewsData, (viewData) => {
            return this._compileView(viewData, viewItemsData[viewData.id]);
        });
    }

    _compileView(viewData, viewItemsData) {
        let view = _.reduce(mappedColumns.view, (memo, column) => {
            memo[column] = viewData[column];
            return memo;
        }, {});
        view.view_list_items = this._compileViewItems(viewItemsData);
        return view;
    }

    _compileViewItems(viewItemsData) {
        return _.map(viewItemsData, (viewItemData) => {
            return this._compileViewItem(viewItemData);
        });
    }

    _compileViewItem(viewItemData) {
        let viewItem = _.reduce(mappedColumns.viewItem, (memo, column) => {
            memo[column] = viewItemData[column];
            return memo;
        }, {});
        //viewItem.keywords = _compileViewItemKeywords();
        return viewItem;
    }

    // TODO: доделать!
    _compileViewItemKeywords(keywordsData) {
        return [];
    }

    _getUserViews(userId, callback) {
        this.knex.raw('SELECT * FROM (SELECT ROW_NUMBER() OVER (PARTITION BY ISNULL(original_view_id, id) ORDER BY timestamp DESC) AS RN, * FROM view WHERE creator = ' + userId + ') T WHERE T.RN = 1')
        .then((viewsData) => {
            callback(null, viewsData);
        })
        .catch((error) => {
            callback(error);
        });
    }

    _getView(userId, viewId, callback) {
        this.knex.select()
            .from('view')
            .innerJoin('view_text', 'view_text.view_id', 'view.id')
            .where('creator', userId)
            .andWhere('id', viewId)
            .then((viewData) => {
                callback(null, viewData[0]);
            })
            .catch((error) => {
                callback(error);
            });
    }

    _getViewItemsByIds(viewIds, callback) {
        if (!_.isArray(viewIds)) {
            viewIds = [viewIds];
        }
        this.knex.select()
            .from('view_item')
            .whereIn('viewId', viewIds)
            .orderBy('view_id', 'asc')
            .then((viewItemsData) => {
                callback(null, viewItemsData);
            })
            .catch((error) => {
                callback(error);
            });
    }

    _getViewItems(viewId, callback) {
        this.knex.select()
            .from('view_item')
            .where('view_id', viewId)
            .orderBy('order', 'asc')
            .then((viewItemsData) => {
                callback(null, viewItemsData);
            })
            .catch((error) => {
                callback(error);
            });
    }

    // TODO: привязать к viewS. Посмотреть по ходу реализации!
    _getViewItemKeywords() {

    }

    _addView(userId, view, trx) {
        const id = super._generateId();
        let dataToInsert = {
            id: id,
            name: view.name,
            view_type: 'user',
            creator: userId
        };
        if (view.originalViewId) {
            dataToInsert.original_view_id = view.originalViewId;
        }
        return this.knex('view')
            .transacting(trx)
            .insert(dataToInsert)
            .then(() => {
                return dataToInsert;
            });
    }

    _addViewDescription(viewId, languId, description, trx) {
        const dataToInsert = {
            view_id: viewId,
            langu_id: languId,
            description: description
        };
        return this.knex('view_text')
            .transacting(trx)
            .insert(dataToInsert)
            .then(() => {
                return dataToInsert;
            });
    }

    _addViewItems(viewId, viewItems, trx) {
        const promises = _.map(viewItems, viewItem => {
            const id = super._generateId();
            const itemToInsert = {
                id: id,
                view_id: viewId,
                field_id: viewItem.fieldId,
                order: viewItem.order,
                sort_order: viewItem.sortOrder,
                sort_direction: viewItem.sortDirection
            };
            return this.knex('view_item')
                .transacting(trx)
                .insert(itemToInsert)
                .then(() => {
                    _.map(viewItem.selectedKeywords,
                        keywordId => this._addViewItemKeywords(itemToInsert.id, keywordId, trx));
                    return itemToInsert.id;
                });
        });
        return Promise.all(promises)
            .then((itemIds) => {
                return itemIds;
            });
    }

    _addViewItemKeywords(viewItemId, keywordId, trx) {
        const dataToInsert = {
            view_item_id: viewItemId,
            keyword_id: keywordId
        };
        return this.knex('view_item_keywords')
            .transacting(trx)
            .insert(dataToInsert)
            .then(() => {
                return dataToInsert;
            });
    }
}

module.exports = ViewsModel;