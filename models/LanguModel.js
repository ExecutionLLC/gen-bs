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

    update(languId, langu, callback) {
        this.db.transactionally((trx, cb) => {
            this._update(languId, langu, trx, cb);
        }, callback);
    }

    findAll(callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .asCallback((error, languages) => {
                    if (error) {
                        callback(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(languages));
                    }
                });
        }, callback);
    }
}

module.exports = LanguModel;