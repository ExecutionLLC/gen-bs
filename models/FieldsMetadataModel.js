'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

const mappedColumns = [
    'id',
    'name',
    'source_name',
    'value_type',
    'filter_control_enable',
    'is_mandatory',
    'is_editable',
    'is_invisible',
    'is_multi_select',
    'langu_id',
    'description'
];

class FieldsMetadataModel extends ModelBase {
    constructor(models) {
        super(models, 'field_metadata', mappedColumns);
    }

    add(languId, metadata, callback) {
        this._add(languId, metadata, false, callback);
    }

    addWithId(languId, metadata, callback) {
        this._add(languId, metadata, true, callback);
    }

    find(id, callback) {

    }

    _add(languId, metadata, withId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (withId ? metadata.id : this._generateId()),
                        name: metadata.name,
                        sourceName: metadata.sourceName,
                        valueType: metadata.valueType,
                        filterControlEnable: metadata.filterControlEnable,
                        isMandatory: metadata.isMandatory,
                        isEditable: metadata.isEditable,
                        isInvisible: metadata.isInvisible,
                        isMultiSelect: metadata.isMultiSelect
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (metadataId, cb) => {
                    const dataToInsert = {
                        fieldId: metadataId,
                        languId: languId,
                        description: metadata.description,
                    };
                    this._insertTable('field_text', dataToInsert, trx, (error) => {
                        cb(error, metadataId);
                    });
                }
            ], cb);
        }, callback);
    }

    find(id, callback) {
        let metadata = {};
        this._fetch(id, (error, fieldMetadata) => {
            if (error) {
                callback(error);
            } else {
                metadata = fieldMetadata;
                this._fetchMetadataKeywords(metadata.id, (error, keywords) => {
                    if (error) {
                        callback(error);
                    } else {
                        metadata.keywords = keywords;
                        callback(null, this._toJson(metadata));
                    }
                });
            }
        });
    }

    //findByUserAndSampleId(userId, sampleId, callback) {
    //
    //}

    _fetchMetadataKeywords(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select('id', 'field_id', 'value')
            .from('keyword')
            .where('field_id', id)
            .asCallback((error, keywords) => {
                if (error) {
                    cb(error);
                } else {
                    this._mapKeywords(keywords, (error, result) => {
                        if (error) {
                            cb(error);
                        } else {
                            cb(null, ChangeCaseUtil.convertKeysToCamelCase(result));
                        }
                    });
                }
            });
        }, callback);
    }

    _mapKeywords(keywords, callback) {
        async.map(keywords, (keyword, cb) => {
            this.models.keywords.fetchKeywordSynonyms(keyword.id, (error, synonyms) => {
                if (error) {
                    cb(error);
                } else {
                    keyword.synonyms = synonyms;
                    cb(null, keyword);
                }
            });
        }, callback);
    }

    _fetch(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTable)
                .innerJoin('field_text', 'field_text.field_id', this.baseTable + '.id')
                .where('id', id)
                .asCallback((error, data) => {
                if (error) {
                    cb(error);
                } else {
                    if (data.length > 0) {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(data[0]));
                    } else {
                        cb(new Error('Item not found: ' + id));
                    }
                }
            });
        }, callback);
    }
}

module.exports = FieldsMetadataModel;