'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = {
    keyword: ['id', 'value'],
    synonyms: ['id', 'keyword_id', 'langu_id', 'value']
}

class KeywordsModel extends ModelBase {
    constructor(models) {
        super(models, 'keyword');
    }

    add(viewItemId, languId, keywords, callback) {

    }

    find(keywordId, callback) {

    }

    viewItemKeywords(viewItemId, callback) {

    }

    // TODO: доделать!
    _compileViewItemKeywords(keywordsData) {
        return [];
    }

    viewKeywords(viewId, callback) {

    }

    viewsKeywords(viewIds, callback) {

    }

    _addKeywords(viewItemId, languId, keywords, trx) {

    }

    _addKeyword(viewItemId, languId, keyword, trx) {

    }

    _addSynonyms(keywordId, languId, synonyms, trx) {

    }

    _addSynonym(keywordId, languId, synonym, trx) {

    }
}

module.exports = KeywordsModel;