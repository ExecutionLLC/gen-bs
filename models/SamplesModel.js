'use strict';

const _ = require('lodash');
const async = require('async');

const {ENTITY_TYPES} = require('../utils/Enums');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');
const SecureModelBase = require('./SecureModelBase');
const Config = require('../utils/Config');

const mappedColumns = [
    'id',
    'fileName',
    'hash',
    'type',
    'isAnalyzed',
    'isDeleted',
    'values',
    'timestamp'
];

const SampleTableNames = {
    Sample: 'sample',
    SampleText: 'sample_text',
    SampleField: 'sample_field',
    SampleEditableField: 'sample_editable_field',
    VcfFile: 'vcf_file'
};

class SamplesModel extends SecureModelBase {
    constructor(models) {
        super(models, SampleTableNames.Sample, mappedColumns);
    }

    find(userId, sampleId, callback) {
        this.db.transactionally((trx, callback) => {
            this._find(trx, sampleId, userId, callback);
        }, callback);
    }

    _find(trx, sampleId, userId, callback) {
        async.waterfall([
            (callback) => this._findSamples(trx, [sampleId], null, userId, false, callback),
            (filters, callback) => callback(null, _.first(filters))
        ], (error, filter) => {
            callback(error, filter);
        });
    }

    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findSamples(trx, null, null, userId, true, callback);
        }, callback);
    }

    findMany(userId, sampleIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findSamples(trx, sampleIds, null, userId, false, callback);
        }, callback);
    }

    attachSampleFields(userId, languId, vcfFileId, sampleFields, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) =>
                    this.models.fields.addMissingFields(languId, sampleFields, trx, (error, fieldsWithIds) => {
                        const fieldIds = _.map(fieldsWithIds, fieldWithId => fieldWithId.id);
                        callback(error, fieldIds);
                    }),
                (fieldIds, callback) => {
                    this._findSamplesMetadata(trx, null, [vcfFileId], userId, false, (error, samples) => {
                        callback(error, fieldIds, _.map(samples, sample => sample.id))
                    });
                },
                (fieldIds, sampleIds, callback) => {
                    const sampleFields = _.flatMap(sampleIds, sampleId => {
                        return _.map(fieldIds, fieldId => {
                            return {
                                sampleId,
                                fieldId
                            }
                        });
                    });
                    this._addSampleFields(trx, sampleFields, (error) => callback(error, sampleIds));
                }
            ], callback)
        }, callback);
    }

    /**
     * Marks sample as analyzed and reduces available sample count for the user,
     * if sample is not yet marked as analyzed.
     *
     * @param userId Id of the user doing request.
     * @param sampleId Id of the sample version in request.
     * @param callback (error, isSampleMarkedAsAnalyzed)
     * */
    makeSampleIsAnalyzedIfNeeded(userId, sampleId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this.find(userId, sampleId, callback),
                (sample, callback) => {
                    const isAnalyzed = sample.isAnalyzed || false;
                    if (!isAnalyzed) {
                        async.waterfall([
                            (callback) => {
                                this._setAnalyzed(sample.id, true, trx, callback);
                            },
                            (sampleId, callback) => {
                                this.models.users.reduceForOnePaidSample(userId, trx, callback);
                            },
                            (paidSamplesCount, callback) => {
                                callback(null, true);
                            }
                        ], callback);
                    } else {
                        callback(null, false);
                    }
                }
            ], callback);
        }, callback);
    }

    update(userId, sampleId, sampleToUpdate, callback) {
        const {name, description} = sampleToUpdate;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._updateSampleText(trx, sampleId, {
                    name,
                    description
                }, (error) => callback(error)),
                (callback) => this._updateSampleEditableFields(trx, sampleId, sampleToUpdate.editableFields, (error) => callback(error)),
                (callback) => this._find(trx, sampleId, userId, callback)
            ], callback);
        }, callback);
    }

    _updateSampleText(trx, sampleId, sampleText, callback) {
        trx(SampleTableNames.SampleText)
            .where('sample_id', sampleId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(sampleText))
            .asCallback(callback);
    }

    _updateSampleEditableFields(trx, sampleId, editableFields, callback) {
        async.map(editableFields, (editableField, callback) => {
            this._updateSampleEditableField(trx, sampleId, editableField, callback);
        }, callback);
    }

    _updateSampleEditableField(trx, sampleId, editableField, callback) {
        const {fieldId, value} = editableField;
        trx(SampleTableNames.SampleEditableField)
            .where('sample_id', sampleId)
            .andWhere('field_id', fieldId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase({value}))
            .asCallback(callback);
    }

    _setAnalyzed(sampleId, value, trx, callback) {
        trx(SampleTableNames.Sample)
            .where('id', sampleId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                isAnalyzed: value,
                analyzedTimestamp: value ? new Date() : null
            }))
            .asCallback((error) => {
                callback(error, sampleId);
            });
    }

    _add(userId, languId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addInTransaction(userId, sample, languId, shouldGenerateId, trx, callback);
        }, callback);
    }

    findSamplesByVcfFileIds(vcfFileIds, shouldExcludeDeletedEntries, callback) {
        this.db.transactionally((trx, callback) => {
            this._findSamples(trx, null, vcfFileIds, null, shouldExcludeDeletedEntries, callback);
        }, callback);
    }

    _addSample(languageId, sample, shouldGenerateId, trx, callback) {
        const {id, vcfFileId, type, isAnalyzed, genotypeName, analyzedTimestamp, fileName, description} =sample;
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : id,
                    type: type || ENTITY_TYPES.USER,
                    isAnalyzed: isAnalyzed || false,
                    genotypeName: genotypeName || null,
                    analyzedTimestamp: analyzedTimestamp || null,
                    vcfFileId
                };
                this._insert(dataToInsert, trx, callback);
            },
            (sampleId, callback) => {
                const name = this._createSampleName(fileName, genotypeName);
                const genotypeText = {
                    sampleId,
                    name,
                    description,
                    languageId: languageId || Config.defaultLanguId
                };
                this._addSampleText(trx, genotypeText, (error) => callback(error, sampleId))
            },
            (sampleId, callback) => {
                const sampleEditableFields = _.map(sample.editableFields, field => {
                    return Object.assign({}, field, {
                        sampleId
                    });
                });
                this._addSampleEditableFields(trx, sampleEditableFields, (error) => callback(error, sampleId));
            },
            (sampleId, callback) => {
                const sampleFields = _.map(sample.sampleFields, field => {
                    return Object.assign({}, field, {
                        sampleId
                    });
                });
                this._addSampleFields(trx, sampleFields, (error) => callback(error, sampleId));
            }
        ], (error, result) => {
            callback(error, result);
        });
    }

    _addSampleText(trx, sampleText, callback) {
        return trx(SampleTableNames.SampleText)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(sampleText))
            .asCallback(callback);
    }

    _addSampleEditableFields(trx, editableFields, callback) {
        async.map(editableFields, (editableField, callback) => {
            this._unsafeInsert(SampleTableNames.SampleEditableField, editableField, trx, callback);
        }, callback);
    }

    _addSampleFields(trx, sampleFields, callback) {
        async.map(sampleFields, (field, callback) => {
            this._unsafeInsert(SampleTableNames.SampleField, field, trx, callback);
        }, callback);
    }

    _addInTransaction(userId, languageId, samples, shouldGenerateId, trx, callback) {
        async.map(samples, (sample, callback) => {
            this._addSample(languageId, sample, shouldGenerateId, trx, callback);
        }, callback);
    }

    _createSampleName(fileName, genotype) {
        const name = genotype ? `${fileName}:${genotype}` : fileName;
        return name.substr(-50, 50);
    }

    addSamples(userId, languageId, samples, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    this.models.fields.findEditableFieldsInTransaction(trx, (error, fieldsMetadata) => {
                        const editableFields = _.map(fieldsMetadata || [], fieldMetadata => ({
                            id: fieldMetadata.id,
                            fieldMetadata
                        }));
                        callback(error, editableFields);
                    });
                },
                (editableFields, callback) => {
                    const samplesWithValues = _.map(samples, sample => {
                        return Object.assign({}, sample, {
                            sampleFields: [],
                            editableFields: _.map(editableFields, fieldWithId => ({
                                fieldId: fieldWithId.id,
                                value: null
                            }))
                        });
                    });
                    this._addInTransaction(userId, languageId, samplesWithValues, false, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _findSamples(trx, sampleIdsOrNull, vcfFileIdsOrNull, userIdOrNull, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findSamplesMetadata(trx, sampleIdsOrNull, vcfFileIdsOrNull, userIdOrNull, excludeDeleted, callback),
            (samples, callback) => this._attachSampleFields(trx, samples, callback),
            (samples, callback) => this._attachSampleEditableFields(trx, samples, callback),
            (samples, callback) => this._attachSampleText(trx, samples, callback)
        ], (error, views) => {
            callback(error, views);
        });
    }

    _attachSampleFields(trx, samples, callback) {
        const sampleIds = _.map(samples, sample => sample.id);
        async.waterfall([
            (callback) => this._findSampleFieldsByIds(trx, sampleIds, callback),
            (sampleFields, callback) => {
                const sampleFieldsBySampleId = _.groupBy(sampleFields, field => field.sampleId);
                const sampleWithFields = _.map(samples, sample => {
                    return Object.assign({}, sample, {
                        sampleFields: sampleFieldsBySampleId[sample.id]
                    });
                });
                callback(null, sampleWithFields);
            }
        ], callback)
    }

    _attachSampleEditableFields(trx, samples, callback) {
        const sampleIds = _.map(samples, sample => sample.id);
        async.waterfall([
            (callback) => this._findSampleEditableFieldsByIds(trx, sampleIds, callback),
            (sampleFields, callback) => {
                const sampleEditableFieldsBySampleId = _.groupBy(sampleFields, field => field.sampleId);
                const sampleWithEditableFields = _.map(samples, sample => {
                    return Object.assign({}, sample, {
                        editableFields: sampleEditableFieldsBySampleId[sample.id]
                    });
                });
                callback(null, sampleWithEditableFields);
            }
        ], callback)
    }

    _attachSampleText(trx, samples, callback) {
        const sampleIds = _.map(samples, sample => sample.id);
        async.waterfall([
            (callback) => this._findSampleTextByIds(trx, sampleIds, callback),
            (sampleTexts, callback) => {
                const sampleTextBySampleId = CollectionUtils.createHashByKey(sampleTexts, 'sampleId');
                const samplesWithText = _.map(samples, sample => {
                    const {name, description} = sampleTextBySampleId[sample.id];
                    return Object.assign({}, sample, {
                        name,
                        description
                    });
                });
                callback(null, samplesWithText);
            }
        ], callback)
    }

    _findSamplesMetadata(trx, sampleIdsOrNull, vcfFileIdsOrNull, userIdOrNull, excludeDeleted, callback) {
        let query = trx.select([
            `${SampleTableNames.Sample}.id`,
            `${SampleTableNames.Sample}.vcf_file_id`,
            `${SampleTableNames.Sample}.genotype_name`,
            `${SampleTableNames.Sample}.is_analyzed`,
            `${SampleTableNames.Sample}.analyzed_timestamp`,
            `${SampleTableNames.Sample}.type`,
            `${SampleTableNames.Sample}.created`,
            `${SampleTableNames.VcfFile}.creator`,
            `${SampleTableNames.VcfFile}.file_name`
        ])
            .from(SampleTableNames.Sample)
            .leftJoin(SampleTableNames.VcfFile, `${SampleTableNames.Sample}.vcf_file_id`, `${SampleTableNames.VcfFile}.id`)
            .whereRaw('1 = 1');
        if (userIdOrNull) {
            query = query.andWhere(function () {
                this.whereNull('creator')
                    .orWhere('creator', userIdOrNull);
            });
        } else {
            query = query.andWhere('creator', null);
        }

        if (excludeDeleted) {
            query = query.andWhere(`${SampleTableNames.Sample}.is_deleted`, false);
        }

        if (sampleIdsOrNull) {
            query = query.andWhere(`${SampleTableNames.Sample}.id`, 'in', sampleIdsOrNull);
        }

        if (vcfFileIdsOrNull) {
            query = query.andWhere(`${SampleTableNames.Sample}.vcf_file_id`, 'in', vcfFileIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (samples, callback) => this._toCamelCase(samples, callback),
            (samples, callback) => {
                if (sampleIdsOrNull) {
                    this._ensureAllItemsFound(samples, sampleIdsOrNull, callback);
                } else {
                    callback(null, samples);
                }
            }
        ], callback);
    }

    _findSampleFieldsByIds(trx, sampleIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.SampleField)
                .whereIn('sample_id', sampleIds)
                .asCallback(callback),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], callback);
    }

    _findSampleEditableFieldsByIds(trx, sampleIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.SampleEditableField)
                .whereIn('sample_id', sampleIds)
                .asCallback(callback),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], callback);
    }

    _findSampleTextByIds(trx, sampleIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.SampleText)
                .whereIn('sample_id', sampleIds)
                .asCallback(callback),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], callback);
    }

    _fetch(userId, sampleId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findSamples(trx, [sampleId], null, userId, false, callback),
                (samples) => {
                    if (!samples.length) {
                        callback(new Error('Item not found: ' + sampleId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(samples[0]));
                    }
                }
            ], callback);
        }, callback);
    }
}

module.exports = SamplesModel;