'use strict';

const ModelBase = require('./ModelBase');

class RemovableModelBase extends ModelBase {
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    remove(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex(this.baseTableName)
                .where('id', id)
                .update({
                    is_deleted: true
                })
                .asCallback(cb)
        }, callback(error, id));
    }
}

module.exports = RemovableModelBase;