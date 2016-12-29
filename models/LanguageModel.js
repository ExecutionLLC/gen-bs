'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'description'];

class LanguageModel extends ModelBase {
    constructor(models) {
        super(models, 'language', mappedColumns);
    }

    add(language, callback) {
        this.db.transactionally((trx, callback) => {
            this._insert(language, trx, callback);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, language);
            }
        });
    }

    update(languageId, language, callback) {
        this.db.transactionally((trx, callback) => {
            this._unsafeUpdate(languageId, language, trx, callback);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, language);
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