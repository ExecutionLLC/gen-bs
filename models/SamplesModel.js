'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'fileName',
    'hash',
    'type',
    'isAnalyzed',
    'isDeleted',
    'values'
];

class SamplesModel extends SecureModelBase {
    constructor(models) {
        super(models, 'vcf_file_sample', mappedColumns);
    }

    find(userId, sampleId, callback) {
        async.waterfall([
            (callback) => { this._fetch(userId, sampleId, callback); },
            (sample, callback) => {
                this._mapFileSampleValues(sample, callback);
            }
        ], callback);
    }

    findAll(userId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchSamplesByUserId(userId, callback);
            },
            (samples, callback) => {
                async.map(samples, (sample, callback) => {
                    this._mapFileSampleValues(sample, callback);
                }, callback);
            }
        ], callback);
    }

    findMany(userId, sampleIds, callback) {
        async.waterfall([
            (callback) => {
                this._fetchSamplesByIds(sampleIds, callback);
            },
            (samples, callback) => {
                if (samples.length === sampleIds.length) {
                    callback(null, samples);
                } else {
                    callback('Some samples not found: ' + sampleIds + ', userId: ' + userId);
                }
            },
            (samples, callback) => {
                if (_.every(samples, 'creator', userId)) {
                    callback(null, samples);
                } else {
                    callback('Unauthorized access to samples: ' + sampleIds + ', userId: ' + userId);
                }
            },
            (samples, callback) => {
                async.map(samples, (sample, callback) => {
                    this._mapFileSampleValues(sample, callback);
                }, callback);
            }
        ], callback);
    }

    addSampleWithMetadata(userId, languId, sample, fieldsMetadata, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                // Add all fields that aren't exist yet and get ids and metadata of all the fields for the sample.
                (callback) => {
                    this.models.fields.addMissingFields(languId, fieldsMetadata, trx, (error, fieldsWithIds) => {
                        callback(error, fieldsWithIds);
                    });
                },
                // Add editable fields to the field list.
                (fieldsWithIds, callback) => {
                    this.models.fields.findEditableFieldsInTransaction(trx, (error, fieldsMetadata) => {
                        const mappedFields = _.map(fieldsMetadata || [], fieldMetadata => {
                            return {
                                id: fieldMetadata.id,
                                fieldMetadata
                            }
                        });
                        const aggregatedFields = fieldsWithIds.concat(mappedFields);
                        callback(error, aggregatedFields);
                    });
                },
                // Create entries for 'vcf_file_sample_values' table to keep field-to-sample connection.
                (fieldsWithIds, callback) => {
                    const sampleWithValues = _.cloneDeep(sample);
                    sampleWithValues.values = _.map(fieldsWithIds, fieldWithId => {
                        return {
                            fieldId: fieldWithId.id,
                            value: null
                        }
                    });

                    // Add sample entries.
                    this._addInTransaction(userId, languId, sampleWithValues, false, trx, (error, resultSample) => {
                        callback(error, resultSample);
                    });
                }
            ], callback);
        }, callback);
    }

    makeAnalyzed(userId, sampleId, callback) {
        this._fetch(userId, sampleId, (error) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, callback) => {
                    this._setAnalyzed(sampleId, true, trx, callback);
                }, callback);
            }
        });
    }

    _setAnalyzed(sampleId, value, trx, callback) {
        trx(this.baseTableName)
            .where('id', sampleId)
            .update({
                is_analyzed: value,
                analyzed_timestamp: value ? this.db.knex.fn.now() : null
            })
            .asCallback((error) => {
                callback(error, sampleId);
            });
    }

    // languId is used for interface compatibility
    _add(userId, languId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addInTransaction(userId, languId, sample, shouldGenerateId, trx, callback);
        }, callback);
    }

    _addInTransaction(userId, languId, sample, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = this._createDataToInsert(userId, sample, shouldGenerateId);
                this._insert(dataToInsert, trx, callback);
            },
            (sampleId, callback) => {
                this._setAnalyzed(sampleId, sample.isAnalyzed || false, trx, callback);
            },
            (sampleId, callback) => {
                this._addNewFileSampleVersion(sampleId, trx, (error, versionId) => {
                    callback(error, {
                        sampleId,
                        versionId
                    });
                });
            },
            (sampleObj, callback) => {
                this._addFileSampleValues(sampleObj.versionId, sample.values, trx, (error) => {
                    callback(error, sampleObj.sampleId);
                });
            }
        ], callback);
    }

    _update(userId, sample, sampleToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToUpdate = {
                        fileName: sampleToUpdate.fileName,
                        hash: sampleToUpdate.hash
                    };
                    this._unsafeUpdate(sample.id, dataToUpdate, trx, callback);
                },
                (sampleId, callback) => {
                    this._setAnalyzed(sampleId, sampleToUpdate.isAnalyzed || false, trx, callback);
                },
                (sampleId, callback) => {
                    this._addNewFileSampleVersion(sampleId, trx, callback);
                },
                (versionId, callback) => {
                    this._addFileSampleValues(versionId, sampleToUpdate.values, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _mapFileSampleValues(sample, callback) {
        this._fetchFileSampleValues(sample.id, (error, values) => {
            if (error) {
                callback(error);
            } else {
                sample.values = values;
                callback(null, this._mapColumns(sample));
            }
        });
    }

    _addNewFileSampleVersion(sampleId, trx, callback) {
        const dataToInsert = {
            id: this._generateId(),
            vcfFileSampleId: sampleId
        };
        this._unsafeInsert('vcf_file_sample_version', dataToInsert, trx, callback);
    }

    /**
     * Adds sample values into vcf_file_sample_value table.
     *
     * @param versionId Id of the sample version.
     * @param values array of the sample values, each of form {fieldId, values (string value for the table column)}.
     * @param trx Knex transaction object.
     * @param callback (error, resulting values list)
     * */
    _addFileSampleValues(versionId, values, trx, callback) {
        async.map(values, (value, callback) => {
            this._addFileSampleValue(versionId, value, trx, callback);
        }, callback);
    }

    _addFileSampleValue(versionId, value, trx, callback) {
        const dataToInsert = {
            vcfFileSampleVersionId: versionId,
            fieldId: value.fieldId,
            values: value.values
        };
        this._unsafeInsert('vcf_file_sample_value', dataToInsert, trx, callback);
    }

    _fetchSamplesByUserId(userId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .where('creator', userId)
                .orWhereNull('creator')
                .andWhere('is_deleted', false)
                .asCallback((error, samplesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(samplesData));
                    }
                });
        }, callback);
    }

    _fetchSamplesByIds(sampleIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', sampleIds)
                .asCallback((error, samplesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(samplesData));
                    }
                });
        }, callback);
    }

    _fetchLastSampleVersion(sampleId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('vcf_file_sample_version')
                .where('vcf_file_sample_id', sampleId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .asCallback((error, sampleData) => {
                    if (error || !sampleData.length) {
                        callback(error || new Error('Item not found: ' + sampleId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(sampleData[0]));
                    }
                });
        }, callback);
    }

    _fetchMetadataForSampleVersion(versionId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from('vcf_file_sample_value')
                .where('vcf_file_sample_version_id', versionId)
                .asCallback((error, result) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(result));
                    }
                });
        }, callback);
    }

    _fetchFileSampleValues(sampleId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchLastSampleVersion(sampleId, callback);
            },
            (sampleVersion, callback) => {
                this._fetchMetadataForSampleVersion(sampleVersion.id, callback);
            }
        ], callback);
    }

    _createDataToInsert(userId, sample, shouldGenerateId) {
        return {
            id: shouldGenerateId ? this._generateId() : sample.id,
            creator: userId,
            fileName: sample.fileName,
            hash: sample.hash,
            type: sample.type || 'user'
        };
    }

}

module.exports = SamplesModel;