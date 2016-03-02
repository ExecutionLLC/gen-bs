'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

const mappedColumns = [
    'id',
    'fieldId',
    'value',
    'synonyms'
];

class KeywordsModel extends ModelBase {
    constructor(models) {
        super(models, 'keyword', mappedColumns);
    }

    find(keywordId, callback) {
        async.waterfall([
            (callback) => this._fetch(keywordId, callback),
            (keyword, callback) => this._mapKeyword(keyword, callback)
        ], callback);
    }

    findMany(keywordIds, callback) {
        async.waterfall([
            (callback) => this._fetchKeywords(keywordIds, callback),
            (keywords, callback) => this._ensureAllItemsFound(keywords, keywordIds, callback),
            (keywords, callback) => this._mapKeywords(keywords, callback)
        ], callback);
    }

    fetchKeywordSynonyms(keywordId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select('id', 'langu_id', 'value')
                .from('synonym_text')
                .where('keyword_id', keywordId)
                .asCallback((error, synonyms) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(synonyms));
                    }
                });
        }, callback);
    }

    _add(keyword, languId, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : keyword.id,
                        fieldId: keyword.fieldId,
                        value: keyword.value
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (keywordId, callback) => {
                    this._addSynonyms(languId, keywordId, keyword.synonyms, shouldGenerateId, trx, (error) => {
                        callback(error, keywordId);
                    });
                }
            ], callback);
        }, callback);
    }

    _addSynonyms(languId, keywordId, synonyms, shouldGenerateId, trx, callback) {
        async.map(synonyms, (synonym, callback) => {
            let dataToInsert = {
                id: (shouldGenerateId ? synonym.id : this._generateId()),
                keywordId: keywordId,
                languId: languId,
                value: synonym.value
            };
            this._unsafeInsert('synonym_text', dataToInsert, trx, callback);
        }, callback);
    }

    _fetchKeywords(keywordIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', keywordIds)
                .asCallback((error, keywordsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(keywordsData));
                    }
                });
        }, callback);
    }

    _mapKeywords(keywords, callback) {
        async.map(keywords, (keyword, callback) => {
            this._mapKeyword(keyword, callback)
        }, callback);
    }

    _mapKeyword(keyword, callback) {
        this.fetchKeywordSynonyms(keyword.id, (error, synonyms) => {
            if (error) {
                callback(error);
            } else {
                keyword.synonyms = synonyms;
                callback(null, this._mapColumns(keyword));
            }
        });
    }
}

module.exports = KeywordsModel;