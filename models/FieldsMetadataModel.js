'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const ModelBase = require('./ModelBase');

const mappedColumns = [
    'id',
    'name',
    'sourceName',
    'valueType',
    'isMandatory',
    'isEditable',
    'isInvisible',
    'dimension',
    'languId',
    'description',
    'label'
];

class FieldsMetadataModel extends ModelBase {
    constructor(models) {
        super(models, 'field_metadata', mappedColumns);
    }

    find(metadataId, callback) {
        async.waterfall([
            (cb) => {
                this._fetch(metadataId, cb);
            },
            (metadata, cb) => {
                cb(null, this._mapColumns(metadata));
            }
        ], callback);
    }

    findMany(metadataIds, callback) {
        async.waterfall([
            (cb) => {
                this._fetchByIds(metadataIds, cb);
            },
            (fieldsMetadata, cb) => {
                this._mapMetadata(fieldsMetadata, cb);
            }
        ], callback);
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        async.waterfall([
            (cb) => {
                this.models.samples.find(userId, sampleId, cb);
            },
            (sample, cb) => {
                const fieldIds = _.pluck(sample.values, 'fieldId');
                this.findMany(fieldIds, cb);
            }
        ], callback);
    }

    findSourcesMetadata(callback) {
        async.waterfall([
            (cb) => {
                this._fetchSourcesMetadata(cb);
            },
            (fieldsMetadata, cb) => {
                this._mapMetadata(fieldsMetadata, cb);
            }
        ], callback);
    }

    findMetadataBySourceName(sourceName, callback) {
        async.waterfall([
            (cb) => {
                this._fetchMetadataBySourceName(sourceName, cb);
            },
            (metadata, cb) => {
                cb(null, this._mapColumns(metadata));
            }
        ], callback);
    }

    findMetadataKeywords(metadataId, callback) {
        async.waterfall([
            (cb) => {
                this._fetchMetadataKeywords(metadataId, cb);
            },
            (keywords, cb) => {
                const keywordIds = _.pluck(viewsData, 'id');
                this.models.keywords.findMany(keywordIds, cb);
            }
        ], callback);
    }

    _add(languId, metadata, shouldGenerateId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (shouldGenerateId ? this._generateId() : metadata.id),
                        name: metadata.name,
                        sourceName: metadata.sourceName,
                        valueType: metadata.valueType,
                        isMandatory: metadata.isMandatory,
                        isEditable: metadata.isEditable,
                        isInvisible: metadata.isInvisible,
                        dimension: metadata.dimension
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (metadataId, cb) => {
                    const dataToInsert = {
                        fieldId: metadataId,
                        languId: languId,
                        description: metadata.description,
                        label: metadata.label
                    };
                    this._insertIntoTable('field_text', dataToInsert, trx, (error) => {
                        cb(error, metadataId);
                    });
                }
            ], cb);
        }, callback);
    }

    _fetch(metadataId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('field_text', 'field_text.field_id', this.baseTableName + '.id')
                .where('id', metadataId)
                .asCallback((error, metadata) => {
                    if (error || !metadata.length) {
                        cb(error || new Error('Item not found: ' + metadataId));
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(metadata[0]));
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

    _fetchSourcesMetadata(callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .whereNot('source_name', 'sample')
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    _fetchMetadataBySourceName(sourceName, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('source_name', sourceName)
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    _fetchMetadataKeywords(metadataId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('keyword')
                .where('field_id', metadataId)
                .asCallback((error, keywords) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(keywords));
                    }
                });
        }, callback);
    }

    _mapMetadata(fieldsMetadata, callback) {
        async.map(fieldsMetadata, (metadata, cb) => {
            cb(null, this._mapColumns(metadata));
        }, callback);
    }

    /**
     * Returns existing field metadata if the field is already in the existingFields array.
     * Returns null, if there is no such field in existingFields array.
     * */
    static getExistingFieldOrNull(fieldMetadata, existingFields, isSourceField) {
        const existingField = _.find(existingFields,
            field => field.name === fieldMetadata.name
            && field.valueType === fieldMetadata.valueType
            && field.dimension === fieldMetadata.dimension
        );
        const shouldAddField =
            (isSourceField && (!fieldMetadata.isMandatory || !existingField)) // Should add copies of all non-mandatory source fields
            || (!isSourceField && !existingField); // Should only add sample fields if there is no existing field.

        if (shouldAddField) {
            return null;
        } else {
            return existingField;
        }
    }
}

module.exports = FieldsMetadataModel;