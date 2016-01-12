'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class ModelBase {
    constructor(models, baseTableName, mappedColumns) {
        this.models = models;
        this.logger = models.logger;
        this.baseTableName = baseTableName;
        this.mappedColumns = mappedColumns;

        this.db = models.db;
    }

    exists(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTableName)
            .where('id', id)
            .asCallback((error, data) => {
                if (error) {
                    cb(error);
                } else {
                    cb(null, (data.length > 0));
                }
            });
        }, callback);
    }

    find(id, callback) {
        this._fetch(id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                callback(null, this._mapColumns(data));
            }
        });
    }

    _generateId() {
        // Generate random UUID
        return Uuid.v4();
    }

    _mapColumns(item) {
        const data = ChangeCaseUtil.convertKeysToSnakeCase(item);
        return _.reduce(this.mappedColumns, (memo, column) => {
            memo[column] = data[column];
            return memo;
        }, {});
    }

    _fetch(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('id', id)
                .asCallback((error, data) => {
                    if(error) {
                        cb(error);
                    } else if (data.length > 0) {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(data[0]));
                    } else {
                        cb(new Error('Item not found: ' + id));
                    }
                });
        }, callback);
    }

    _insert(dataToInsert, trx, callback) {
        this._insertIntoTable(this.baseTableName, dataToInsert, trx, callback);
    }

    _insertIntoTable(tableName, dataToInsert, trx, callback) {
        trx(tableName)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
            .asCallback((error) => {
                callback(error, dataToInsert.id);
            });
    };

    _update(id, dataToUpdate, trx, callback) {
        trx(this.baseTableName)
            .where('id', id)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, id);
            });
    }
}

module.exports = ModelBase;