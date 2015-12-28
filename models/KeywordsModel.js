'use strict';

const _ = require('lodash');

const async = require('async');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'keyword_id', 'langu_id', 'value'];

class KeywordsModel extends ModelBase {
    constructor(models) {
        super(models, 'keyword', mappedColumns);
    }

    add(languId, keyword, callback) {
        let _keyword = this._init(keyword);
        this.db.knex.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insertKeyword(_keyword, trx, cb);
                },
                (keywordId, cb) => {
                    this._addSynonyms(languId, keywordId, _keyword.synonyms, trx, (error) => {
                        cb(error, keywordId);
                    });
                }
            ], cb);
        }, callback);
    }

    _addSynonyms(languId, keywordId, synonyms, trx, callback) {
        let synonymIds = [];
        async.map(synonyms, (synonym, cb) => {
            let _synonym = synonym;
            _synonym.keywordId = keywordId;
            _synonym.languId = languId;
            this.models.synonyms._insert(_synonym, trx, (error, synonymId) => {
                if (error) {
                    cb(error);
                } else {
                    synonymIds.push(synonymId);
                    cb(null, synonymId);
                }
            });
        }, callback(error, synonymIds));
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: id,
            value: data.name
        }
        super._insert(dataToInsert, trx, callback);
    }
}

module.exports = KeywordsModel;