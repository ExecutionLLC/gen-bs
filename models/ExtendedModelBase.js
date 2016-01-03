'use strict';

const ModelBase = require('./ModelBase');

class ExtendedModelBase extends ModelBase {
    constructor(models, baseTable, mappedColumns) {
        super(models, baseTable, mappedColumns);
    }

    remove(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex(this.baseTable)
                .where('id', id)
                .update({
                    is_deleted: true
                })
                .asCallback(cb)
        }, callback(error, id));
    }

    _init(languId, data) {
        let result = data;
        if (this.generateIds) { result.id = this._generateId(); };
        result.languId = languId;
        return result;
    }
}

module.exports = ExtendedModelBase;