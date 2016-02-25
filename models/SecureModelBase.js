'use strict';

const _ = require('lodash');
const async = require('async');

const RemovableModelBase = require('./RemovableModelBase');

const ITEM_NOT_FOUND = 'Item not found.';

class SecureModelBase extends RemovableModelBase {
    /**
     * @param models Reference to the models facade
     * @param baseTableName Name of the main (or the only) table of the corresponding model.
     * @param mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    add(userId, languId, item, callback) {
        item.type = 'user';
        async.waterfall([
            (callback) => {
                this._add(userId, languId, item, true, callback);
            },
            (id, callback) => {
                this.find(userId, id, callback);
            }
        ], callback);
    }

    addWithId(userId, languId, item, callback) {
        item.type = 'user';
        async.waterfall([
            (callback) => {
                this._add(userId, languId, item, false, callback);
            },
            (id, callback) => {
                this.find(userId, id, callback);
            }
        ], callback);
    }

    internalAdd(userId, languId, filter, callback) {
        this._add(userId, languId, filter, false, callback);
    }

    update(userId, id, item, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(userId, id, callback);
            },
            (itemData, callback) => {
                if (itemData.isDeleted) {
                    callback(new Error(ITEM_NOT_FOUND));
                } else {
                    this._update(userId, itemData, item, callback);
                }
            },
            (itemId, callback) => {
                this.find(userId, itemId, callback);
            }
        ], callback);
    }

    find(userId, id, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(userId, id, callback);
            },
            (itemData, callback) => {
                if (itemData.isDeleted) {
                    callback(new Error(ITEM_NOT_FOUND))
                } else {
                    callback(null, this._mapColumns(itemData));
                }
            }
        ], callback);
    }

    // Set is_deleted = true
    remove(userId, id, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(userId, id, callback);
            },
            (itemData, callback) => {
                super.remove(itemData.id, callback);
            }
        ], callback);
    }

    _fetch(userId, id, callback) {
        async.waterfall([
            (callback) => {
                super._fetch(id, callback);
            },
            (itemData, callback) => {
                this._checkUserIsCorect(userId, itemData, callback);
            }
        ], callback);
    }

    _checkUserIsCorect(userId, itemData, callback) {
        const secureInfo = {userId};
        this._secureCheck(itemData, secureInfo, callback);
    }

    // Default data, which is available for everybody, has creator set to null
    _secureCheck(itemData, secureInfo, callback) {
        if (_.isNull(itemData.creator)
            || secureInfo.userId === itemData.creator) {
                callback(null, itemData);
        } else {
            callback(new Error('Entity access denied.'));
        }
    }
}

module.exports = SecureModelBase;