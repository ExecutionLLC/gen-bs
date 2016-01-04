'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'description'];

class LanguModel extends ModelBase {
    constructor(models) {
        super(models, 'langu', mappedColumns);
    }

    add(langu, callback) {
        this.db.transactionally((trx, cb) => {
            this._insert(langu, trx, cb);
        }, callback);
    }

    update(id, langu, callback) {
        this.db.transactionally((trx, cb) => {
            this._update(id, langu, trx, cb);
        }, callback);
    }
}

module.exports = LanguModel;