'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

class ViewsModel extends ModelBase {
    constructor(models) {
        super(models);
    }

    add(user, view, callback) {
        this._addView(user, view)
            .then(insertedView => {
                const viewId = insertedView.id;
                const languId = user.defaultLanguId;
                return new Promise((resolve, reject) => {
                    this._addViewDescription(viewId, languId, view.description)
                        .then(() => {
                            this._addViewItems(viewId, view.viewListItems);
                        })
                        .then(() => {
                            resolve(insertedView.id);
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            })
            .then((viewId) => {
                callback(null, viewId);
            })
            .catch(error => {
                callback(error);
            });
    }

    _addView(user, view) {
        return new Promise((resolve, reject) => {
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
                    resolve(dataToInsert);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    _addViewDescription(viewId, languId, description) {
        const dataToInsert = {
            view_id: viewId,
            langu_id: languId,
            description: description
        };
        return this.knex('view_text')
            .insert(dataToInsert);
    }

    _addViewItems(viewId, viewItems) {
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
                });
        });
        return Promise.all(promises);
    }

    _addViewItemKeywords(viewItemId, keywordId) {
        const dataToInsert = {
            view_item_id: viewItemId,
            keyword_id: keywordId
        };
        return this.knex('view_item_keywords')
            .insert(dataToInsert);
    }
}