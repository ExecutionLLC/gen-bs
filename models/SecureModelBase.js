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
        async.waterfall([
            (callback) => {
                this._add(userId, languId, item, true, callback);
            },
            (id, callback) => {
                this.find(userId, id, callback);
            }
        ], callback);
    }

    internalAdd(userId, languId, filter, callback) {
        this._add(userId, languId, filter, false, callback);
    }

    addWithId(userId, languId, item, callback) {
        async.waterfall([
            (callback) => {
                this._add(userId, languId, item, false, callback);
            },
            (id, callback) => {
                this.find(userId, id, callback);
            }
        ], callback);
    }

    update(userId, id, item, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(userId, id, callback);
            },
            (itemData, callback) => {
                this._update(userId, itemData, item, callback);
            },
            (itemId, callback) => {
                this.find(userId, itemId, callback);
            }
        ], callback);
    }

    find(userId, id, callback) {
        this._fetch(userId, id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                callback(null, this._mapColumns(data));
            }
        });
    }

    // Set is_deleted = true
    remove(userId, id, callback) {
        this._fetch(userId, id, (error) => {
            if (error) {
                callback(error);
            } else {
                super.remove(id, callback);
            }
        });
    }

    // Default data, which is available for everybody, has creator set to null
    _secureCheck(data, secureInfo, callback) {
        if (_.isNull(data.creator)
            || secureInfo.userId === data.creator) {
            callback(null, data);
        } else {
            callback(new Error('Entity access denied.'));
        }
    }

    _fetch(userId, id, callback) {
        super._fetch(id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }
}

module.exports = SecureModelBase;