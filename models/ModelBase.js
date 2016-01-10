'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const KnexWrapper = require('../utils/KnexWrapper');

const Config = require('../utils/Config');

const loggerSettings = Config.logger;
const databaseSettings = Config.database;

const knexConfig = {
    client: 'pg',
    connection: {
        host: databaseSettings.host,
        user: databaseSettings.user,
        password: databaseSettings.password,
        database: databaseSettings.databaseName
    }
};

// KnexWrapper instance should only be created once per application
const knexWrapper = new KnexWrapper(knexConfig, loggerSettings);

class ModelBase {
    constructor(models, baseTable, mappedColumns) {
        this.models = models;
        this.logger = models.logger;
        this.baseTable = baseTable;
        this.mappedColumns = mappedColumns;

        this.db = knexWrapper;
    }

    exists(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTable)
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
                callback(null, this._toJson(data));
            }
        });
    }

    _generateId() {
        // Generate random UUID
        return Uuid.v4();
    }

    _toJson(item) {
        const data = ChangeCaseUtil.convertKeysToSnakeCase(item);
        return _.reduce(this.mappedColumns, (memo, column) => {
            memo[column] = data[column];
            return memo;
        }, {});
    }

    _fetch(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTable)
                .where('id', id)
                .asCallback((error, data) => {
                    if(error) {
                        cb(error);
                    } else {
                        if (data.length > 0) {
                            cb(null, ChangeCaseUtil.convertKeysToCamelCase(data[0]));
                        } else {
                            cb(new Error('Item not found: ' + id));
                        }
                    }
                });
        }, callback);
    }

    _insert(dataToInsert, trx, callback) {
        this._insertTable(this.baseTable, dataToInsert, trx, callback);
    }

    _insertTable(tableName, dataToInsert, trx, callback) {
        trx.asCallback((knex, cb) => {
            knex(tableName)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
                .asCallback(cb);
        }, (error) => {
            callback(error, dataToInsert.id);
        });
    };

    _update(id, dataToUpdate, trx, callback) {
        trx.asCallback((knex, cb) => {
            knex(this.baseTable)
                .where('id', id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
                .asCallback(cb);
        }, (error) => {
            callback(error, id);
        });
    }
}

module.exports = ModelBase;