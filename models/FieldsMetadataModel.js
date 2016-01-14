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

    find(metadataId, callback) {
        async.waterfall([
            (cb) => {
                this._fetch(metadataId, cb);
            },
            (metadata, cb) => {
                this._mapMetadata(metadata, cb);
            }
        ], callback);
    }

    findMany(metadataIds, callback) {
        async.waterfall([
            (cb) => {
                this._fetchByIds(metadataIds, cb);
            },
            (fieldsMetadata, cb) => {
                async.map(fieldsMetadata, (metadata, cbk) => {
                    this._mapMetadata(metadata, cbk);
                }, cb);
            }
        ], callback);
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        async.waterfall([
            (cb) => {
                this._fetchMetadataBySampleId(sampleId, cb);
            },
            (metadata, cb) => {
                if (metadata.creator == userId) {
                    cb(null, metadata);
                } else {
                    cb(new Error('Security check: user not found'));
                }
            },
            (metadata, cb) => {
                this._mapMetadata(metadata, cb);
            }
        ], callback);
    }

    _add(languId, metadata, withId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (withId ? metadata.id : this._generateId()),
                        name: metadata.name,
                        sourceName: metadata.sourceName,
                        valueType: metadata.valueType || 'user',
                        filterControlEnable: metadata.filterControlEnable || true,
                        isMandatory: metadata.isMandatory || false,
                        isEditable: metadata.isEditable || true,
                        isInvisible: metadata.isInvisible || false,
                        isMultiSelect: metadata.isMultiSelect || true
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (metadataId, cb) => {
                    const dataToInsert = {
                        fieldId: metadataId,
                        languId: languId,
                        description: metadata.description,
                    };
                    this._insertIntoTable('field_text', dataToInsert, trx, (error) => {
                        cb(error, metadataId);
                    });
                }
            ], cb);
        }, callback);
    }

    _mapMetadata(metadata, callback) {
        this._fetchMetadataKeywords(metadata.id, (error, keywords) => {
            if (error) {
                cb(error);
            } else {
                metadata.keywords = keywords;
                callback(null, this._mapColumns(metadata));
            }
        });
    }

    _fetchMetadataBySampleId(sampleId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample')
                .innerJoin('vcf_file_sample_values', 'vcf_file_sample_values.vcf_file_sample_version_id', 'vcf_file_sample_version.id')
                .innerJoin('field_metadata', 'field_metadata.id', 'vcf_file_sample_values.field_id')
                .innerJoin('field_text', 'field_text.field_id', 'field_metadata.id')
                .orderBy('vcf_file_sample_version.timestamp', 'desc')
                .where('vcf_file_sample_id', sampleId)
                .limit(1)
                .asCallback((error, metadata) => {
                    if (error) {
                        cb(error);
                    } else if (data.length > 0) {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(metadata[0]));
                    } else {
                        cb(new Error('Item not found: ' + sampleId));
                    }
                });
        }, callback);
    }

    _fetchMetadataKeywords(metadataId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select('id', 'field_id', 'value')
            .from('keyword')
            .where('field_id', metadataId)
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

    _fetch(metadataId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('field_text', 'field_text.field_id', this.baseTableName + '.id')
                .where('id', metadataId)
                .asCallback((error, metadata) => {
                if (error) {
                    cb(error);
                } else if (metadata.length > 0) {
                    cb(null, ChangeCaseUtil.convertKeysToCamelCase(metadata[0]));
                } else {
                    cb(new Error('Item not found: ' + metadataId));
                }
            });
        }, callback);
    }

    _fetchByIds(metadataIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('field_text', 'field_text.field_id', this.baseTableName + '.id')
                .whereIn('id', metadataIds)
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    findMany(ids, callback) {
        const fields = _.filter(this.fields, (field) => _.any(ids, fieldId => field.id === fieldId));
        callback(null, fields);
    }
}

module.exports = FieldsMetadataModel;