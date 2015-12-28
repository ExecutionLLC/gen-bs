'use strict';

const _ = require('lodash');
const async = require('async');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'view_id', 'field_id', 'order', 'sort_order', 'sort_direction'];

class ViewItemsModel extends ModelBase {
    constructor(models) {
        super(models, 'view_item', mappedColumns);
    }

    _addKeywords(viewItemId, keywords, trx, callback) {
        let keywordIds = [];
        async.map(keywords, (keyword, cb) => {
            this._addKeyword(viewItemId, keyword.id, trx, (error, keywordId) => {
                if (error) {
                    cb(error);
                } else {
                    keywordIds.push(keywordId);
                    cb(null, keywordId);
                }
            });
        }, callback(error, keywordIds));
    }

    _addKeyword(viewItemId, keywordId, trx, callback) {
        const dataToInsert = {
            viewItemId: viewItemId,
            keywordId: keywordId
        };
        this._insertTable('view_item_keyword', dataToInsert, trx, callback);
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            viewId: data.viewId,
            order: data.order,
            sortOrder: data.sort_order,
            sortDirection: data.sortDirection
        };

        super._insert(dataToInsert, trx, (error, viewItemId) => {
            if (error) {
                callback(error);
            } else {
                this._addKeywords(viewItemId, data.keywords, trx, (error) => {
                    callback(error, viewItemId);
                });
            }
        });
    }
}

module.exports = ViewItemsModel;