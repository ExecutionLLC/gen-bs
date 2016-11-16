'use strict';

const async = require('async');

const ModelBase = require('./ModelBase');

class RemovableModelBase extends ModelBase {
    /**
     * @param models Reference to the models facade
     * @param baseTableName Name of the main (or the only) table of the corresponding model.
     * @param mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    find(itemId, callback) {
        async.waterfall([
            (callback) => super.find(itemId, callback)
        ], callback);
    }

    remove(itemId, callback) {
        this.db.transactionally((trx, callback) => {
            super._unsafeUpdate(itemId, {isDeleted: true}, trx, callback);
        }, callback);
    }
}

module.exports = RemovableModelBase;