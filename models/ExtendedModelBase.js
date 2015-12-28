'use strict';

const ModelBase = require('./ModelBase');

class ExtendedModelBase extends ModelBase {
    constructor(models, baseTable, mappedColumns) {
        super(models, baseTable, mappedColumns);
    }

    remove(id, callback) {
        this.db.knex(this.baseTable)
            .where('id', id)
            .update({
                is_deleted: true
            })
            .exec((error) => {
                calback(error, id);
            });
    }

    _init(languId, data) {
        let _data = super._init(data);
        _data.languId = languId;
        return _data;
    }
}

module.exports = ExtendedModelBase;