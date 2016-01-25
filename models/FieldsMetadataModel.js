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
    'is_mandatory',
    'is_editable',
    'is_invisible',
    'dimension',
    'langu_id',
    'description',
    'label'
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
                this.models.samples.find(userId, sampleId, cb);
            },
            (sample, cb) => {
                cb(null, sample.values);
            }
            //,
            //(metadata, cb) => {
            //    this._mapMetadata(metadata, cb);
            //}
        ], callback);
    }

    findSourcesMetadata(callback) {
        this._fetchMetadataBySource('source', callback);
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
                        isMandatory: metadata.isMandatory || false,
                        isEditable: metadata.isEditable || false,
                        isInvisible: metadata.isInvisible || false,
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

    _mapMetadata(metadata, callback) {



        //this._fetchMetadataKeywords(metadata.id, (error, keywords) => {
        //    if (error) {
        //        cb(error);
        //    } else {
        //        if (_.isNull(metadata.label)) {
        //            metadata.label = metadata.name;
        //        }
        //        metadata.keywords = keywords;
        //        callback(null, this._mapColumns(metadata));
        //    }
        //});
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

    _fetchMetadataBySource(source, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('source_name', source)
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