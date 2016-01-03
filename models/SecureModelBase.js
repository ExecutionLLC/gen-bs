'use strict';

const ExtendedModelBase = require('./ExtendedModelBase');

class SecureModelBase extends ExtendedModelBase {
    constructor(models, baseTable, mappedColumns) {
        super(models, baseTable, mappedColumns);
    }

    find(userId, id, callback) {
        this._fetch(userId, id, (error, data) => {
            callback(error, this._toJson(data));
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

    _init(userId, languId, data) {
        let result = data;
        if (this.generateIds) { result.id = this._generateId(); };
        result.languId = languId;
        result.creator = userId;
        return result;
    }

    _secureCheck(data, secureInfo, callback) {
        if (secureInfo.userId !== data.creator) {
            callback(new Error('Security check: user not found'));
        } else {
            callback(null, data);
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