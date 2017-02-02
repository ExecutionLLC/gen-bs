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
    'timestamp',
    'uploadState',
    'error'
];

const SampleTableNames = {
    Sample: 'sample',
    SampleText: 'sample_text',
    SampleField: 'sample_field',
    SampleMetadata: 'sample_metadata',
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
            (samples, callback) => callback(null, _.first(samples))
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

    attachSampleFields(userId, languageId, vcfFileId, sampleFields, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) =>
                    this.models.fields.addMissingFields(languageId, sampleFields, trx, (error, fieldsWithIds) => {
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
        const sampleText = _.find(sampleToUpdate.text, text => _.isNull(text.languageId));
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._updateSampleText(trx, sampleId, sampleText, (error) => callback(error)),
                (callback) => this._updateSampleMetadataValues(trx, sampleId, sampleToUpdate.sampleMetadata, (error) => callback(error)),
                (callback) => this._setUploadState(trx, sampleId, sampleToUpdate.uploadState, sampleToUpdate.error, (error) => callback(error)),
                (callback) => this._find(trx, sampleId, userId, callback)
            ], callback);
        }, callback);
    }

    _updateSampleText(trx, sampleId, sampleText, callback) {
        trx(SampleTableNames.SampleText)
            .where('sample_id', sampleId)
            .andWhere('language_id', sampleText.languageId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(sampleText))
            .asCallback(callback);
    }

    _updateSampleMetadataValues(trx, sampleId, sampleMetadataValues, callback) {
        async.map(sampleMetadataValues, (metadata, callback) => {
            this._updateSampleMetadata(trx, sampleId, metadata, callback);
        }, callback);
    }

    _updateSampleMetadata(trx, sampleId, metadata, callback) {
        const {metadataId} = metadata;
        const metadataText = _.find(metadata.text, text => _.isNull(text.languageId));
        const {languageId, value} = metadataText;
        trx(SampleTableNames.SampleMetadata)
            .where('sample_id', sampleId)
            .andWhere('metadata_id', metadataId)
            .andWhere('language_id', languageId)
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

    _setUploadState(trx, sampleId, uploadState, error, callback) {
        trx(SampleTableNames.Sample)
            .where('id', sampleId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                uploadState,
                error
            }))
            .asCallback((error) => callback(error, sampleId));
    }

    _add(userId, languageId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addInTransaction(userId, sample, languageId, shouldGenerateId, trx, callback);
        }, callback);
    }

    findSamplesByVcfFileIds(userId, vcfFileIds, shouldExcludeDeletedEntries, callback) {
        this.db.transactionally((trx, callback) => {
            this._findSamples(trx, null, vcfFileIds, userId, shouldExcludeDeletedEntries, callback);
        }, callback);
    }

    _addSample(languageId, sample, shouldGenerateId, trx, callback) {
        const {id, vcfFileId, type, isAnalyzed, genotypeName, analyzedTimestamp, fileName, description,
            uploadState} = sample;
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : id,
                    type: type || ENTITY_TYPES.USER,
                    isAnalyzed: isAnalyzed || false,
                    genotypeName: genotypeName || null,
                    analyzedTimestamp: analyzedTimestamp || null,
                    vcfFileId,
                    uploadState
                };
                this._insert(dataToInsert, trx, callback);
            },
            (sampleId, callback) => {
                const name = this._createSampleName(fileName, genotypeName);
                const genotypeText = {
                    sampleId,
                    name,
                    description,
                    languageId: null
                };
                this._addSampleText(trx, genotypeText, (error) => callback(error, sampleId))
            },
            (sampleId, callback) => {
                const sampleMetadata = _.map(sample.sampleMetadata, field => {
                    return Object.assign({}, field, {
                        sampleId
                    });
                });
                this._addSampleMetadata(trx, sampleMetadata, (error) => callback(error, sampleId));
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

    _addSampleMetadata(trx, editableFields, callback) {
        async.map(editableFields, (field, callback) => {
            const {sampleId, metadataId, text: {languageId, value}} = field;
            const editableField = {
                sampleId,
                metadataId,
                languageId,
                value
            };
            this._unsafeInsert(SampleTableNames.SampleMetadata, editableField, trx, callback);
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
                    this.models.metadata.findEditableMetadata((error, metadatas) => {
                        const editableMetadata = _.map(metadatas || [], metadata => ({
                            id: metadata.id,
                            metadata
                        }));
                        callback(error, editableMetadata);
                    });
                },
                (editableMetadata, callback) => {
                    const samplesWithValues = _.map(samples, sample => {
                        return Object.assign({}, sample, {
                            sampleFields: [],
                            sampleMetadata: _.map(editableMetadata, fieldWithId => ({
                                metadataId: fieldWithId.id,
                                text: [
                                    {
                                        value: null,
                                        languageId: null
                                    }
                                ]
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
            (samples, callback) => this._attachSampleMetadata(trx, samples, callback),
            (samples, callback) => this._attachSampleText(trx, samples, callback)
        ], callback);
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

    _attachSampleMetadata(trx, samples, callback) {
        const sampleIds = _.map(samples, sample => sample.id);
        async.waterfall([
            (callback) => this._findSampleMetadataByIds(trx, sampleIds, callback),
            (sampleFields, callback) => {
                const sampleMetadataBySampleId = _.groupBy(sampleFields, field => field.sampleId);
                const sampleWithEditableFields = _.map(samples, sample => {
                    return Object.assign({}, sample, {
                        sampleMetadata: sampleMetadataBySampleId[sample.id]
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
                const textsHash = _.groupBy(sampleTexts, 'sampleId');
                const samplesWithText = _.map(samples, sample => {
                    return Object.assign({}, sample, {
                        text: _.map(textsHash[sample.id], text => {
                            const {description, languageId, name} = text;
                            return {
                                name,
                                description,
                                languageId
                            };
                        })
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
            `${SampleTableNames.Sample}.upload_state`,
            `${SampleTableNames.Sample}.error`,
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
            query = query.andWhere(`${SampleTableNames.VcfFile}.is_deleted`, false);
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

    _findSampleMetadataByIds(trx, sampleIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.SampleMetadata)
                .whereIn('sample_id', sampleIds)
                .asCallback(callback),
            (rows, callback) => {
                this._toCamelCase(rows, callback)
            },
            (rows, callback) => {
                const groupesBySampleId = _.groupBy(rows, row => row.sampleId);
                const groupedByMetadataAndLanguageId = _.flatMap(groupesBySampleId, groupBySampleId => {
                    const groupedByMetadataId = _.groupBy(groupBySampleId, group => group.metadataId);
                    return _.map(groupedByMetadataId, group => {
                        const defaultMetadata = _.first(group);
                        const {sampleId, metadataId} = defaultMetadata;
                        return {
                            sampleId,
                            metadataId,
                            text: _.map(group, groupValue => {
                                const {languageId, value} = groupValue;
                                return {
                                    languageId,
                                    value
                                }
                            })
                        };
                    });
                });
                callback(null, groupedByMetadataAndLanguageId);
            }
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