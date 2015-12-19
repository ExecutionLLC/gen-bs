'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

class ViewsModel extends ModelBase {
    constructor(models) {
        super(models);
    }

    add(user, view, callback) {
        this._addView(user, view, (error, insertedView) => {
            if (error) {
                callback(error);
            } else {
                const viewId = insertedView.id;
                const languId = user.defaultLanguId;
                this._addViewDescription(viewId, languId, view.description, (error) => {
                    if (error) {
                        callback(error);
                    } else {
                        this._addViewItems(viewId, view.viewListItems, (error) => {
                            if (error) {
                                callback(error);
                            } else {
                                callback(null, viewId);
                            }
                        });
                    }
                });
            }
        });
    }

    _addView(user, view, callback) {
        const userId = user.id;
        const id = super._generateId();
        const dataToInsert = {
            id: id,
            name: view.name,
            view_type: 'user',
            creator: userId
        };

        this.knex('view')
            .insert(dataToInsert)
            .then(() => {
                callback(null, dataToInsert);
            })
            .catch(error => {
                callback(error);
            });
    }

    _addViewDescription(viewId, languId, description, callback) {
        const dataToInsert = {
            view_id: viewId,
            langu_id: languId,
            description: description
        };
        this.knex('view_text')
            .insert(dataToInsert)
            .then(() => {
                callback(null, dataToInsert);
            })
            .catch(error => {
                callback(error);
            });
    }

    _addViewItems(viewId, viewItems, callback) {
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
                .insert(itemToInsert)
                .then(() => {
                    _.map(viewItem.selectedKeywords,
                        keywordId => this._addViewItemKeywords(itemToInsert.id, keywordId));;
                    return itemToInsert.id;
                });
        });
        Promise.all(promises)
            .then((itemIds) => {
                callback(null, itemIds);
            })
            .catch((error) => {
                callback(error);
            });
    }

    _addViewItemKeywords(viewItemId, keywordId, callback) {
        const dataToInsert = {
            view_item_id: viewItemId,
            keyword_id: keywordId
        };
        this.knex('view_item_keywords')
            .insert(dataToInsert)
            .then(() => {
                callback(null, dataToInsert);
            })
            .catch((error) => {
                callback(error);
            });
    }
}