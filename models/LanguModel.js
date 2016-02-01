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
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, langu);
            }
        });
    }

    update(languId, langu, callback) {
        this.db.transactionally((trx, cb) => {
            this._unsafeUpdate(languId, langu, trx, cb);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, langu);
            }
        });
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