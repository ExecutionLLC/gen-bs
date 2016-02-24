'use strict';

const async = require('async');

const ModelBase = require('./ModelBase');

const ITEM_NOT_FOUND = 'Item not found.';

class RemovableModelBase extends ModelBase {
    /**
     * @param models Reference to the models facade
     * @param baseTableName Name of the main (or the only) table of the corresponding model.
     * @param mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    find(id, callback) {
        async.waterfall([
            (callback) => {
                super.find(id, callback);
            },
            (itemData, callback) => {
                if (itemData.isDeleted) {
                    callback(new Error(ITEM_NOT_FOUND));
                } else {
                    callback(null, itemData);
                }
            }
        ], callback);
    }

    remove(id, callback) {
        this.db.transactionally((trx, callback) => {
            super._unsafeUpdate(id, {isDeleted: true}, trx, callback);
        }, callback);
    }
}

module.exports = RemovableModelBase;