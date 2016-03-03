'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'description'];

class LanguageModel extends ModelBase {
    constructor(models) {
        super(models, 'langu', mappedColumns);
    }

    add(langu, callback) {
        this.db.transactionally((trx, callback) => {
            this._insert(langu, trx, callback);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, langu);
            }
        });
    }

    update(languId, langu, callback) {
        this.db.transactionally((trx, callback) => {
            this._unsafeUpdate(languId, langu, trx, callback);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, langu);
            }
        });
    }

    findAll(callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .asCallback((error, languages) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(languages));
                    }
                });
        }, callback);
    }
}

module.exports = LanguageModel;