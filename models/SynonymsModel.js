'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'keyword_id', 'langu_id', 'value'];

class SynonymsModel extends ModelBase {
    constructor(models) {
        super(models, 'synonym_text', mappedColumns);
    }

    add(synonym, callback) {
        let _synonym = this._init(synonym);
        this.db.knex.transactionally((trx, cb) => {
            this._insert(_synonym, trx, cb)
        }, callback);
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: id,
            languId: data.languId,
            keywordId: data.keywordId,
            value: data.name
        }
        super._insert(dataToInsert, trx, callback);
    }
}

module.exports = SynonymsModel;