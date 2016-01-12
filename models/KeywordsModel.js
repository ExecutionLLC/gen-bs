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

    find(keywordId, callback) {
        async.waterfall([
            (cb) => {
                this._fetch(keywordId, cb);
            },
            (keyword, cb) => {
                this.fetchKeywordSynonyms(keywordId, (error, synonyms) => {
                    if (error) {
                        cb(error);
                    } else {
                        keyword.synonyms = synonyms;
                        cb(null, this._mapColumns(keyword));
                    }
                });
            }
        ], callback);
    }

    findMany(keywordIds, callback) {
        async.waterfall([
            (cb) => {
                this._fetchKeywords(keywordIds, cb);
            },
            (keywords, cb) => {
                if (keywords.length == keywordIds.length) {
                    cb(null, keywords);
                } else {
                    cb('Inactive keywords found: ' + keywordIds);
                }
            },
            (keywords, cb) => {
                async.map(keywords, (keyword, cbk) => {
                    this.fetchKeywordSynonyms(keywordId, (error, synonyms) => {
                        if (error) {
                            cbk(error);
                        } else {
                            keyword.synonyms = synonyms;
                            cbk(null, this._mapColumns(keyword));
                        }
                    });
                }, cb);
            }
        ], callback);
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
                        // fieldId: keyword.fieldId,
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
            this._insertIntoTable('synonym_text', dataToInsert, trx, cb);
        }, callback);
    }

    _fetchKeywords(keywordIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', keywordIds)
                .asCallback((error, keywordsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(keywordsData));
                    }
                });
        }, callback);
    }
}

module.exports = KeywordsModel;