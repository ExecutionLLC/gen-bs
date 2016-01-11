'use strict';

const RemovableModelBase = require('./RemovableModelBase');

class SecureModelBase extends RemovableModelBase {
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    find(userId, id, callback) {
        this._fetch(userId, id, (error, data) => {
            callback(error, this._mapColumns(data));
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