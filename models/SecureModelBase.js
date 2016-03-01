'use strict';

const _ = require('lodash');
const async = require('async');

const RemovableModelBase = require('./RemovableModelBase');

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
            (callback) => this._add(userId, languId, item, true, callback),
            (itemId, callback) => this.find(userId, itemId, callback)
        ], callback);
    }

    addWithId(userId, languId, item, callback) {
        item.type = 'user';
        async.waterfall([
            (callback) => this._add(userId, languId, item, false, callback),
            (itemId, callback) => this.find(userId, itemId, callback)
        ], callback);
    }

    internalAdd(userId, languId, filter, callback) {
        this._add(userId, languId, filter, false, callback);
    }

    update(userId, itemId, item, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => this._ensureItemNotDeleted(itemData, callback),
            (itemData, callback) => this._update(userId, itemData, item, callback),
            (itemId, callback) => this.find(userId, itemId, callback)
        ], callback);
    }

    find(userId, itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => this._ensureItemNotDeleted(itemData, callback),
            (itemData, callback) => {
                callback(null, this._mapColumns(itemData));
            }
        ], callback);
    }

    // Set is_deleted = true
    remove(userId, itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => super.remove(itemData.id, callback)
        ], callback);
    }

    _fetch(userId, itemId, callback) {
        async.waterfall([
            (callback) => super._fetch(itemId, callback),
            (itemData, callback) => this._checkUserIsCorrect(userId, itemData, callback)
        ], callback);
    }

    _checkUserIsCorrect(userId, itemData, callback) {
        const secureInfo = {userId};
        this._secureCheck(itemData, secureInfo, callback);
    }

    // Default data, which is available for everybody, has creator set to null
    _secureCheck(itemData, secureInfo, callback) {
        if (_.isNull(itemData.creator)
            || itemData.creator === secureInfo.userId) {
            callback(null, itemData);
        } else {
            callback(new Error('Entity access denied.'));
        }
    }

    _fetch(userId, itemId, callback) {
        super._fetch(itemId, (error, itemData) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(itemData, secureInfo, callback);
            }
        });
    }
}

module.exports = SecureModelBase;