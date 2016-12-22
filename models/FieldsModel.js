'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const ModelBase = require('./ModelBase');

const TableNames = {
    Field: 'field',
    FieldText: 'field_text'
};

class FieldsModel extends ModelBase {
    constructor(models) {
        super(models, TableNames.Field);
    }

    findAll(callback) {
        this.db.transactionally((trx, callback) => {
            this._findFields(trx, null, null, null, null, null, null, null, callback);
        }, callback);
    }

    findMany(fieldIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findFields(trx, fieldIds, null, null, null, null, null, null, callback);
        }, callback);
    }

    find(fieldId, callback) {
        const fieldIds = [fieldId];
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findFields(trx, fieldIds, null, null, null, null, null, null, callback),
                (fields, callback) => callback(null, _.first(fields))
            ], callback);
        }, callback);
    }

    addMany(languId, fieldsMetadata, callback) {
        this.db.transactionally((trx, callback) => {
            async.map(fieldsMetadata, (fieldMetadata, callback) => {
                this.addInTransaction(trx, languId, fieldMetadata, false, callback);
            }, callback);
        }, callback);
    }

    _addInTransaction(trx, languId, metadata, shouldGenerateId, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : metadata.id,
                    name: metadata.name,
                    sourceName: metadata.sourceName,
                    valueType: metadata.valueType,
                    isMandatory: metadata.isMandatory,
                    isInvisible: metadata.isInvisible,
                    dimension: metadata.dimension,
                    isHyperlink: metadata.isHyperlink || false,
                    hyperlinkTemplate: metadata.hyperlinkTemplate || null
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
                this._unsafeInsert(TableNames.FieldText, dataToInsert, trx, (error) => {
                    callback(error, metadataId);
                });
            }
        ], callback);
    }

    addMissingFields(languId, fields, trx, callback) {
        // Ensure the coming fields are unique in terms of the same rule as below.
        const uniqueFields = _.uniqBy(fields, (field) => `${field.name}#${field.valueType}#${field.dimension}`);
        async.waterfall([
            (callback) => {
                // First, for each field try to find existing one.
                async.mapSeries(uniqueFields, (fieldMetadata, callback) => {
                    this._findIdOfTheSameAsOrNullInTransaction(fieldMetadata, trx, (error, id) => {
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
                        this._addInTransaction(trx, languId, fieldWithId.fieldMetadata, true, (error, insertedFieldId) => {
                            fieldWithId.id = insertedFieldId ? insertedFieldId : null;
                            callback(error, fieldWithId);
                        });
                    } else {
                        callback(null, fieldWithId);
                    }
                }, callback);
            }
        ], callback);
    }

    getExistingSourceNames(callback) {
        this.db.asCallback((knex, callback) => {
            knex(this.baseTableName)
                .distinct('source_name')
                .select()
                .whereNot({
                    source_name: 'sample'
                })
                .asCallback((error, sources) => {
                    if (error) {
                        callback(error);
                    } else {
                        const sourceNames = _.map(ChangeCaseUtil.convertKeysToCamelCase(sources), 'sourceName');
                        callback(null, sourceNames);
                    }
                });
        }, callback);
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        async.waterfall([
            (callback) => this.models.samples.find(userId, sampleId, callback),
            (sample, callback) => {
                const fieldIds = _.map(sample.sampleFields, 'fieldId');
                this.findMany(fieldIds, callback);
            }
        ], callback);
    }

    findByUserAndSampleIds(userId, sampleIds, callback) {
        async.waterfall([
            (callback) => this.models.samples.findMany(userId, sampleIds, callback),
            (samples, callback) => {
                const fieldIds = _.uniq([].concat.apply([], _.map(samples, sample => _.map(sample.sampleFields, 'fieldId'))));
                this.findMany(fieldIds, callback);
            }
        ], callback);
    }

    findSourcesFields(callback) {
        this.db.transactionally((trx, callback) => {
            this._findFields(trx, null, null, true, null, null, null, null, callback);
        }, callback);
    }

    _findIdOfTheSameAsOrNullInTransaction(fieldMetadata, trx, callback) {
        const {name, valueType, dimension} = fieldMetadata;
        async.waterfall([
            (callback) => this._findFields(trx, null, null, null, null, name, valueType, dimension, callback),
            (fields, callback) => callback(null, fields.length ? _.first(fields).id : null)
        ], callback)
    }

    _findFields(trx,
                fieldIdsOrNull,
                isMandatoryOrNull,
                isSourceOrNull,
                languageIdOrNull,
                nameOrNull,
                valueTypeOrNull,
                dimensionOrNull,
                callback) {
        async.waterfall([
            (callback) => this._findFieldsValues(
                trx,
                fieldIdsOrNull,
                isMandatoryOrNull,
                isSourceOrNull,
                languageIdOrNull,
                nameOrNull,
                valueTypeOrNull,
                dimensionOrNull,
                callback
            ),
            (fieldValues, callback) => this._attachKeywords(fieldValues, callback)
        ], callback);
    }

    _attachKeywords(fieldValues, callback) {
        const fieldIds = _.map(fieldValues, field => field.id);
        async.waterfall([
            (callback) => this.models.keywords.findForFieldIds(fieldIds, callback),
            (keywords, callback) => {
                const fieldIdsToKeywords = _.groupBy(keywords, keyword => keyword.fieldId);
                const fieldsWithKeywords = _.map(fieldValues,
                    (field) => {
                        return {
                            ...field,
                            keywords: fieldIdsToKeywords[field.id] || []
                        }
                    });
                callback(null, fieldsWithKeywords);
            }
        ], callback);
    }

    _findFieldsValues(trx,
                      fieldIdsOrNull,
                      isMandatoryOrNull,
                      isSourceOrNull,
                      languageIdOrNull,
                      nameOrNull,
                      valueTypeOrNull,
                      dimensionOrNull,
                      callback) {
        let query = trx.select([
            `${TableNames.Field}.id`,
            `${TableNames.Field}.name`,
            `${TableNames.Field}.source_name`,
            `${TableNames.Field}.value_type`,
            `${TableNames.Field}.is_mandatory`,
            `${TableNames.Field}.is_invisible`,
            `${TableNames.Field}.dimension`,
            `${TableNames.Field}.is_hyperlink`,
            `${TableNames.Field}.hyperlink_template`,
            `${TableNames.FieldText}.label`,
            `${TableNames.FieldText}.description`
        ])
            .from(TableNames.Field)
            .leftJoin(TableNames.FieldText, `${TableNames.FieldText}.field_id`, `${TableNames.Field}.id`)
            .whereRaw('1 = 1');
        if (fieldIdsOrNull) {
            query = query.andWhere(`${TableNames.Field}.id`, 'in', fieldIdsOrNull);
        }
        if (isMandatoryOrNull) {
            query = query.andWhere(`${TableNames.Field}.is_mandatory`, isMandatoryOrNull);
        }
        if (isSourceOrNull) {
            query = query.andWhereNot(`${TableNames.Field}.source_name`, 'sample');
        }
        query = query.andWhere(`${TableNames.FieldText}.langu_id`, languageIdOrNull || this.models.config.defaultLanguId);

        if (nameOrNull) {
            query = query.andWhere(`${TableNames.Field}.name`, nameOrNull);
        }
        if (valueTypeOrNull) {
            query = query.andWhere(`${TableNames.Field}.value_type`, valueTypeOrNull);
        }
        if (dimensionOrNull) {
            query = query.andWhere(`${TableNames.Field}.dimension`, dimensionOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (fields, callback) => this._toCamelCase(fields, callback),
            (fields, callback) => {
                if (fieldIdsOrNull) {
                    this._ensureAllItemsFound(fields, fieldIdsOrNull, callback);
                } else {
                    callback(null, fields);
                }
            }
        ], callback);
    };

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

module.exports = FieldsModel;