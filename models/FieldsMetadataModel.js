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

    /**
     * Finds id of the existing field metadata which has the same name, dimension and value type.
     * If there is no such metadata, sends null as result.
     *
     * @param fieldMetadata Field metadata to search for.
     * @param trx Knex transaction object.
     * @param callback (error, fieldMetadataId or null)
     * */
    findIdOfTheSameAsOrNullInTransaction(fieldMetadata, trx, callback) {
        trx.select('id')
            .from(this.baseTableName)
            .where('name', fieldMetadata.name)
            .andWhere('value_type', fieldMetadata.valueType)
            .andWhere('dimension', fieldMetadata.dimension)
            .asCallback((error, results) => {
                const existingMetadataId = (results && results.length) ? results[0].id : null;
                callback(error, existingMetadataId);
            });
    }

    /**
     * Finds all editable fields.
     *
     * @param trx Knex transaction object.
     * @param callback (error, fieldsMetadata)
     * */
    findEditableFieldsInTransaction(trx, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(this.baseTableName)
                    .where('is_editable', true)
                    .asCallback(callback);
            },
            (fieldsMetadata, callback) => this._mapFieldsMetadata(fieldsMetadata, callback)
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

    getExistingSourceNames(callback) {
        async.waterfall([
            (callback) => {
                this._fetchExistingSourceNames(callback);
            },
            (existingSources, callback) => {
                callback(null, _.pluck(existingSources, 'source_name'));
            }
        ], callback);
    }

    _fetchExistingSourceNames(callback) {
        this.db.asCallback((knex, callback) => {
            knex(this.baseTableName)
                .distinct('source_name')
                .select()
                .whereNot({
                    source_name: 'sample'
                })
                .asCallback(callback);
        }, callback);
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

    addInTransaction(trx, languId, metadata, shouldGenerateId, callback) {
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
                this._addAvailableValues(metadataId, metadata, shouldGenerateId, trx, (error) => {
                    callback(error, metadataId);
                });
            }
        ], callback);
    }

    /**
     * Adds missing fields from the specified collection. Result will contain fields with ids.
     *
     * @param languId Language for the description.
     * @param fieldsMetadata Collection of the fields metadata to check.
     * @param trx Knex transaction object.
     * @param callback (error, results) where results - array, item.id - new or existing field metadata id,
     * item.fieldMetadata - input metadata.
     * */
    addMissingFields(languId, fieldsMetadata, trx, callback) {
        async.waterfall([
            (callback) => {
                // First, for each field try to find existing one.
                async.mapSeries(fieldsMetadata, (fieldMetadata, callback) => {
                    this.findIdOfTheSameAsOrNullInTransaction(fieldMetadata, trx, (error, id) => {
                        callback(error, {
                            fieldMetadata,
                            id
                        });
                    });
                }, callback);
            },
            (fieldsWithIds, callback) => {
                // Second, insert each of the missing fields and update their ids.
                async.mapSeries(fieldsWithIds, (fieldWithId, callback) => {
                    if (!fieldWithId.id) {
                        this.addInTransaction(trx, languId, fieldWithId.fieldMetadata, true, (error, insertedFieldId) => {
                            fieldWithId.id = (insertedFieldId) ? insertedFieldId : null;
                            callback(error, fieldWithId);
                        });
                    } else {
                        callback(null, fieldWithId);
                    }
                }, callback);
            }
        ], callback);
    }

    _add(languId, metadata, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this.addInTransaction(trx, languId, metadata, shouldGenerateId, callback);
        }, callback);
    }

    _addAvailableValues(metadataId, metadata, shouldGenerateId, trx, callback) {
        if (metadata.availableValues) {
            async.map(metadata.availableValues, (availableValue, callback) => {
                this._addAvailableValue(metadataId, availableValue, shouldGenerateId, trx, callback);
            }, callback);
        } else {
            callback(null, metadataId);
        }
    }

    _addAvailableValue(metadataId, availableValue, shouldGenerateId, trx, callback) {
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
                    languId: availableValue.languId,
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