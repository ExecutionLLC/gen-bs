'use strict';

const _ = require('lodash');
const async = require('async');

const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class ModelBase {
    /**
     * @param models Reference to the models facade
     * @param baseTableName Name of the main (or the only) table of the corresponding model.
     * @param mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        this.models = models;
        this.logger = models.logger;
        this.baseTableName = baseTableName;
        this.mappedColumns = mappedColumns;

        this.db = models.db;
    }

    add(languId, item, callback) {
        async.waterfall([
            (callback) => {
                this._add(languId, item, true, callback);
            },
            (id, callback) => {
                this.find(id, callback);
            }
        ], callback);
    }

    addWithId(languId, item, callback) {
        async.waterfall([
            (callback) => {
                this._add(languId, item, false, callback);
            },
            (id, callback) => {
                this.find(id, callback);
            }
        ], callback);
    }

    exists(id, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
            .from(this.baseTableName)
            .where('id', id)
            .asCallback((error, itemData) => {
                if (error) {
                    callback(error);
                } else {
                    callback(null, (itemData.length > 0));
                }
            });
        }, callback);
    }

    find(id, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(id, callback);
            },
            (itemData, callback) => {
                callback(null, this._mapColumns(itemData));
            }
        ], callback);
    }

    _generateId() {
        // Generate random UUID
        return Uuid.v4();
    }

    _mapColumns(item) {
        const data = ChangeCaseUtil.convertKeysToCamelCase(item);
        return _.reduce(this.mappedColumns, (memo, column) => {
            memo[column] = data[column];
            return memo;
        }, {});
    }

    _fetch(id, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .where('id', id)
                .asCallback((error, itemData) => {
                    if (error || !itemData.length) {
                        callback(error || new Error('Item not found: ' + id));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(itemData[0]));
                    }
                });
        }, callback);
    }

    _insert(dataToInsert, trx, callback) {
        this._unsafeInsert(this.baseTableName, dataToInsert, trx, callback);
    }

    _unsafeInsert(tableName, dataToInsert, trx, callback) {
        trx(tableName)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
            .asCallback((error) => {
                callback(error, dataToInsert.id);
            });
    };

    _unsafeUpdate(id, dataToUpdate, trx, callback) {
        trx(this.baseTableName)
            .where('id', id)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, id);
            });
    }
}

module.exports = ModelBase;