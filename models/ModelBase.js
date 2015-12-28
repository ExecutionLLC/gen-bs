'use strict';

const _ = require('lodash');

const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const Knex = require('knex');
const KnexWrapper = require('../lib/KnexWrapper');

const Config = require('../utils/Config');
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

// Knex instance should only be created once per application.
const knexSingleton = new Knex(knexConfig);
const knexWrapper = new KnexWrapper(knexSingleton);

class ModelBase {
    constructor(models, baseTable, mappedColumns) {
        this.models = models;
        this.baseTable = baseTable;
        this.mappedColumns = mappedColumns;

        this.db = knexWrapper;
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

    _init(data) {
        let _data = data;
        _data.id = this._generateId();
        return _data;
    }

    _toJson(item) {
        return ChangeCaseUtil.convertToSnakeCase(
            _.reduce(this.mappedColumns, (memo, column) => {
                memo[column] = item[column];
                return memo;
            }, {}));
    }

    _exists(id, callback) {
        this.db.knex.select()
            .from(this.baseTable)
            .where('id', id)
            .exec((error, data) => {
                callback(error, (data.length > 0));
            });
    }

    _fetch(id, callback) {
        this.db.knex.select()
            .from(this.baseTable)
            .where('id', id)
            .exec((error, data) => {
                if (error) {
                    callback(error);
                } else {
                    if (data.length > 0) {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(data[0]));
                    } else {
                        callback(new Error('Item not found: ' + id));
                    }
                }
            });
    }

    _insert(data, trx, callback) {
        this._insertTable(this.baseTable, data, trx, callback);
    }

    _insertTable(tableName, data, trx, callback) {
        trx.exec((knex, cb) => {
            knex(tableName)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase(data))
                .exec((error) => {
                    cb(error, data.id);
                });
        }, callback);
    }
}

module.exports = ModelBase;