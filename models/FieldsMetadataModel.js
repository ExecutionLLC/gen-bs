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
    'label',
    'availableValues'
];

class FieldsMetadataModel extends ModelBase {
    constructor(models) {
        super(models, 'field_metadata', mappedColumns);
    }

    find(metadataId, callback) {
        async.waterfall([
            (callback) => {
                this._fetch(metadataId, callback);
            },
            (fieldMetadata, callback) => {
                this._mapFieldMetadata(fieldMetadata, callback);
            }
        ], callback);
    }

    findMany(metadataIds, callback) {
        async.waterfall([
            (callback) => {
                this._fetchByIds(metadataIds, callback);
            },
            (fieldsMetadata, callback) => {
                this._mapFieldsMetadata(fieldsMetadata, callback);
            }
        ], callback);
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        async.waterfall([
            (callback) => {
                this.models.samples.find(userId, sampleId, callback);
            },
            (sample, callback) => {
                const fieldIds = _.pluck(sample.values, 'fieldId');
                this.findMany(fieldIds, callback);
            }
        ], callback);
    }

    findSourcesMetadata(callback) {
        async.waterfall([
            (callback) => {
                this._fetchSourcesMetadata(callback);
            },
            (fieldsMetadata, callback) => {
                this._mapFieldsMetadata(fieldsMetadata, callback);
            }
        ], callback);
    }

    findMetadataBySourceName(sourceName, callback) {
        async.waterfall([
            (callback) => {
                this._fetchMetadataBySourceName(sourceName, callback);
            },
            (fieldsMetadata, callback) => {
                this._mapFieldsMetadata(fieldsMetadata, callback);
            }
        ], callback);
    }

    findMetadataKeywords(metadataId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchMetadataKeywords(metadataId, callback);
            },
            (keywords, callback) => {
                const keywordIds = _.pluck(viewsData, 'id');
                this.models.keywords.findMany(keywordIds, callback);
            }
        ], callback);
    }

    _add(languId, metadata, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
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
                    this._insert(dataToInsert, trx, callback);
                },
                (metadataId, callback) => {
                    const dataToInsert = {
                        fieldId: metadataId,
                        languId: languId,
                        description: metadata.description,
                        label: metadata.label
                    };
                    this._unsafeInsert('field_text', dataToInsert, trx, (error) => {
                        callback(error, metadataId);
                    });
                },
                (metadataId, callback) => {
                    this._addAvailableValues(languId, metadataId, metadata, shouldGenerateId, trx, (error) => {
                        callback(error, metadataId);
                    });
                }
            ], callback);
        }, callback);
    }

    _addAvailableValues(languId, metadataId, metadata, shouldGenerateId, trx, callback) {
        if (metadata.availableValues) {
            async.map(metadata.availableValues, (availableValue, callback) => {
                this._addAvailableValue(languId, metadataId, availableValue, shouldGenerateId, trx, callback);
            }, callback);
        } else {
            callback(null, metadataId);
        }
    }

    _addAvailableValue(languId, metadataId, availableValue, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: (shouldGenerateId ? this._generateId() : availableValue.id),
                    fieldId: metadataId
                };
                this._unsafeInsert('field_available_value', dataToInsert, trx, callback);
            },
            (fieldAvailableValueId, callback) => {
                const dataToInsert = {
                    fieldAvailableValueId: fieldAvailableValueId,
                    languId: languId,
                    value: availableValue.value
                };
                this._unsafeInsert('field_available_value_text', dataToInsert, trx, callback);
            }
        ], callback);
    }

    _fetch(metadataId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('field_text', 'field_text.field_id', this.baseTableName + '.id')
                .where('id', metadataId)
                .asCallback((error, metadata) => {
                    if (error || !metadata.length) {
                        callback(error || new Error('Item not found: ' + metadataId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(metadata[0]));
                    }
            });
        }, callback);
    }

    _fetchByIds(metadataIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('field_text', 'field_text.field_id', this.baseTableName + '.id')
                .whereIn('id', metadataIds)
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    _fetchSourcesMetadata(callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .whereNot('source_name', 'sample')
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    _fetchMetadataBySourceName(sourceName, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .where('source_name', sourceName)
                .asCallback((error, fieldsMetadata) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fieldsMetadata));
                    }
                });
        }, callback);
    }

    _fetchMetadataKeywords(metadataId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('keyword')
                .where('field_id', metadataId)
                .asCallback((error, keywords) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(keywords));
                    }
                });
        }, callback);
    }

    _mapFieldsMetadata(fieldsMetadata, callback) {
        async.map(fieldsMetadata, (fieldMetadata, callback) => {
            this._mapFieldMetadata(fieldMetadata, callback);
        }, callback);
    }

    _mapFieldMetadata(fieldMetadata, callback) {
        async.waterfall([
            (callback) => {
                this._fetchFieldAvailableValues(fieldMetadata.id, callback);
            },
            (fieldAvailableValues, callback) => {
                if (fieldAvailableValues && (fieldAvailableValues.length > 0)) {
                    fieldMetadata.availableValues = fieldAvailableValues;
                }
                callback(null, this._mapColumns(fieldMetadata));
            }
        ], callback);
    }

    _fetchFieldAvailableValues(metadataId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('field_available_value')
                .innerJoin('field_available_value_text', 'field_available_value_text.field_available_value_id', 'field_available_value.id')
                .whereIn('field_id', metadataId)
                .asCallback((error, fieldAvailableValues) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fieldAvailableValues));
                    }
                });
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