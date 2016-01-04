'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'field_id', 'value', 'synonyms'];

class KeywordsModel extends ModelBase {
    constructor(models) {
        super(models, 'keyword', mappedColumns);
    }

    add(languId, keyword, callback) {
        let keywordData = this._init(keyword);
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(keywordData, trx, cb);
                },
                (keywordId, cb) => {
                    this._addSynonyms(languId, keywordId, keyword.synonyms, trx, (error) => {
                        cb(error, keywordId);
                    });
                }
            ], cb);
        }, callback);
    }

    _addSynonyms(languId, keywordId, synonyms, trx, callback) {
        async.map(synonyms, (synonym, cb) => {
            let synonymData = {
                keywordId: keywordId,
                languId: languId,
                value: synonym.value
            };
            if (this.generateIds) {
                synonymData.id = this._generateId;
            } else {
                synonymData.id = synonym.id;
            }
            this._addSynonym(synonymData, trx, cb);
        }, callback);
    }

    find(id, callback) {
        let keyword = {};
        this._fetch(id, (error, keywordData) => {
            if (error) {
                callback(error);
            } else {
                keyword = keywordData;
                this.fetchKeywordSynonyms(keyword.id, (error, synonyms) => {
                    if (error) {
                        callback(error);
                    } else {
                        keyword.synonyms = synonyms;
                        callback(null, this._toJson(keyword));
                    }
                });
            }
        });
    }

    fetchKeywordSynonyms(keywordId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select('id', 'langu_id', 'value')
                .from('synonym_text')
                .where('keyword_id', keywordId)
                .asCallback((error, synonyms) => {
                if (error) {
                    cb(error);
                } else {
                    cb(null, ChangeCaseUtil.convertKeysToCamelCase(synonyms));
                }
            });
        }, callback);
    }

    _addSynonym(synonym, trx, callback) {
        this._insertTable('synonym_text', synonym, trx, callback);
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            value: data.name
        }
        super._insert(dataToInsert, trx, callback);
    }
}

module.exports = KeywordsModel;