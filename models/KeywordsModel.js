'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

const mappedColumns = [
    'id',
    'field_id',
    'value',
    'synonyms'
];

class KeywordsModel extends ModelBase {
    constructor(models) {
        super(models, 'keyword', mappedColumns);
    }

    add(languId, keyword, callback) {
        this._add(languId, keyword, false, callback);
    }

    addWithId(languId, keyword, callback) {
        this._add(languId, keyword, true, callback);
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

    _add(languId, keyword, withIds, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (withIds ? keyword.id : this._generateId()),
                        value: keyword.value
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (keywordId, cb) => {
                    this._addSynonyms(languId, keywordId, keyword.synonyms, withIds, trx, (error, result) => {
                        cb(error, keywordId);
                    });
                }
            ], cb);
        }, callback);
    }

    _addSynonyms(languId, keywordId, synonyms, withIds, trx, callback) {
        async.map(synonyms, (synonym, cb) => {
            let dataToInsert = {
                id: (withIds ? synonym.id : this._generateId()),
                keywordId: keywordId,
                languId: languId,
                value: synonym.value
            };
            this._insertTable('synonym_text', dataToInsert, trx, callback);
        }, callback);
    }
}

module.exports = KeywordsModel;