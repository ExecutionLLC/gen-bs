'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const async = require('async');

const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');

const ITEM_NOT_FOUND = 'Item not found.';

class ModelBase {
    /**
     * @param {ModelsFacade}models Reference to the models facade
     * @param {string}baseTableName Name of the main (or the only) table of the corresponding model.
     * @param {Array<string>}mappedColumns List of column names that will be allowed to extract
     * from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        this.models = models;
        this.logger = models.logger;
        this.baseTableName = baseTableName;
        this.mappedColumns = mappedColumns;

        this.db = models.db;
    }

    add(item, languId, callback) {
        async.waterfall([
            (callback) => this._add(item, languId, true, callback),
            (itemId, callback) => this.find(itemId, callback)
        ], callback);
    }

    addWithId(item, languId, callback) {
        async.waterfall([
            (callback) => this._add(item, languId, false, callback),
            (itemId, callback) => this.find(itemId, callback)
        ], callback);
    }

    exists(itemId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select('id')
                .from(this.baseTableName)
                .where('id', itemId)
                .asCallback((error, itemData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, (itemData.length > 0));
                    }
                });
        }, callback);
    }

    find(itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(itemId, callback),
            (itemData, callback) => {
                callback(null, this._mapColumns(itemData));
            }
        ], callback);
    }

    _add(item, languId, shouldGenerateId, callback) {
        throw new Error('Method is abstract.');
    }

    _generateId() {
        return Uuid.v4();
    }

    _mapColumns(item) {
        const itemData = ChangeCaseUtil.convertKeysToCamelCase(item);
        return CollectionUtils.createHash(this.mappedColumns,
            _.identity,
            (column) => itemData[column]
        );
    }

    _ensureItemNotDeleted(item, callback) {
        if (!item.isDeleted) {
            callback(null, item);
        } else {
            callback(new Error(ITEM_NOT_FOUND));
        }
    }

    /**
     * @protected
     * */
    _toCamelCase(itemOrItems, callback) {
        this._toCamelCaseAsync(itemOrItems)
            .asCallback(callback);
    }

    /**
     * @protected
     * */
    _toCamelCaseAsync(itemOrItems) {
        return Promise.resolve(ChangeCaseUtil.convertKeysToCamelCase(itemOrItems));
    }

    /**
     * @param {string}name
     * @param {function(Error)}callback
     */
    _ensureNameIsValid(name, callback) {
        const trimmedName = (name || '').trim();
        if (_.isEmpty(trimmedName)) {
            callback(new Error('Name cannot be empty.'));
        } else {
            callback(null);
        }
    }

    _ensureAllItemsFound(itemsFound, itemIdsToFind, callback) {
        return this._ensureAllItemsFoundAsync(itemsFound, itemIdsToFind)
            .asCallback(callback);
    }

    _ensureAllItemsFoundAsync(itemsFound, itemIdsToFind) {
        if (itemsFound && itemsFound.length === itemIdsToFind.length) {
            return Promise.resolve(itemsFound);
        }
        return Promise.reject(new Error(`Part of the items is not found: ${itemIdsToFind}, found: ${itemsFound}`));
    }

    _mapItems(items, callback) {
        async.map(items, (item, callback) => {
            callback(null, this._mapColumns(item));
        }, callback);
    }

    _fetch(itemId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .where('id', itemId)
                .asCallback((error, itemData) => {
                    if (error || !itemData.length) {
                        callback(error || new Error('Item not found: ' + itemId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(itemData[0]));
                    }
                });
        }, callback);
    }

    _insert(dataToInsert, trx, callback) {
        this._unsafeInsert(this.baseTableName, dataToInsert, trx, callback);
    }

    _insertAsync(dataToInsert, trx) {
        return this._unsafeInsertAsync(this.baseTableName, dataToInsert, trx);
    }

    _unsafeInsert(tableName, dataToInsert, trx, callback) {
        trx(tableName)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
            .asCallback((error) => {
                callback(error, dataToInsert.id);
            });
    }

    _unsafeInsertAsync(tableName, dataToInsert, trx) {
        return trx(tableName)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
            .then(() => dataToInsert.id);
    }

    _unsafeUpdate(itemId, dataToUpdate, trx, callback) {
        trx(this.baseTableName)
            .where('id', itemId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, itemId);
            });
    }
}

module.exports = ModelBase;