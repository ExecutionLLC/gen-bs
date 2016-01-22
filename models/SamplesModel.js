'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'file_name',
    'hash',
    'sample_type',
    'is_analyzed',
    'is_deleted',
    'vcf_file_sample_version_id',
    'field_id',
    'values'
];

class SamplesModel extends SecureModelBase {
    constructor(models) {
        super(models, 'vcf_file_sample', mappedColumns);
    }

    add(userId, languId, sample, callback) {
        this._add(userId, languId, sample, false, callback);
    }

    addWithId(userId, languId, sample, callback) {
        this._add(userId, languId, sample, true, callback);
    }

    update(userId, sampleId, sample, callback) {
        this._fetch(userId, sampleId, (error) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToUpdate = {
                                fileName: sample.fileName,
                                hash: sample.hash,
                                isAnalized: sample.isAnalyzed,
                                sampleType: sample.sampleType
                            };
                            this._update(sampleId, dataToUpdate, trx, cb);
                        },
                        (id, cb) => {
                            this._addNewFileSampleVersion(sampleId, trx, cb);
                        },
                        (versionId, cb) => {
                            this._addFileSampleValues(versionId, sample.values, trx, cb);
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, sampleId, callback) {
        async.waterfall([
            (cb) => { this._fetch(userId, sampleId, cb); },
            (sample, cb) => {
                this._mapFileSampleValues(sample, cb);
            }
        ], callback);
    }

    findAll(userId, callback) {
        async.waterfall([
            (cb) => {
                this._fetchSamplesByUserId(userId, cb);
            },
            (samples, cb) => {
                async.map(samples, (sample, cbk) => {
                    this._mapFileSampleValues(sample, cbk);
                }, cb);
            }
        ], callback);
    }

    findMany(userId, sampleIds, callback) {
        async.waterfall([
            (cb) => {
                this._fetchSamplesByIds(sampleIds, cb);
            },
            (samples, cb) => {
                if (samples.length == samples.length) {
                    cb(null, samples);
                } else {
                    cb('Inactive samples found: ' + sampleIds + ', userId: ' + userId);
                }
            },
            (samples, cb) => {
                if (_.every(samples, 'creator', userId)) {
                    cb(null, samples);
                } else {
                    cb('Unauthorized samples: ' + sampleIds + ', userId: ' + userId);
                }
            },
            (samples, cb) => {
                async.map(samples, (sample, cbk) => {
                    this._mapFileSampleValues(sample, cbk);
                }, cb);
            }
        ], callback);
    }

    makeAnalyzed(userId, sampleId, callback) {
        this._fetch(userId, sampleId, (error) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    this._setAnalyzed(sampleId, true, trx, cb);
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
    _add(userId, languId, sample, withId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (withId ? sample.id : this._generateId()),
                        creator: userId,
                        fileName: sample.fileName,
                        hash: sample.hash,
                        isAnalyzed: sample.isAnalyzed || false,
                        sampleType: 'standard'
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (sampleId, cb) => {
                    this._addNewFileSampleVersion(sampleId, trx, (error, versionId) => {
                        if (error) {
                            cb(error);
                        } else {
                            cb(null, {sampleId, versionId});
                        }
                    });
                },
                (sampleObj, cb) => {
                    this._addFileSampleValues(sampleObj.versionId, sample.values, trx, (error) => {
                        cb(error, sampleObj);
                    });
                }
            ], cb);
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
        this._insertIntoTable('vcf_file_sample_version', dataToInsert, trx, callback);
    }

    _addFileSampleValues(versionId, values, trx, callback) {
        async.map(values, (value, cb) => {
            this._addFileSampleValue(versionId, value, trx, cb);
        }, callback);
    }

    _addFileSampleValue(versionId, value, trx, callback) {
        const dataToInsert = {
            vcfFileSampleVersionId: versionId,
            fieldId: value.fieldId,
            values: value.values
        };
        this._insertIntoTable('vcf_file_sample_value', dataToInsert, trx, callback);
    }

    _fetchSamplesByUserId(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('creator', userId)
                .orWhereNull('creator')
                .andWhere('is_deleted', false)
                .asCallback((error, samplesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(samplesData));
                    }
                });
        }, callback);
    }

    _fetchSamplesByIds(sampleIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', sampleIds)
                .asCallback((error, samplesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(samplesData));
                    }
                });
        }, callback);
    }

    _fetchLastSampleVersionId(sampleId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample_version')
                .where('vcf_file_sample_id', sampleId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .asCallback((error, result) => {
                    if (error) {
                        cb(error);
                    } else if (result.length > 0) {
                        cb(null, result[0].id);
                    } else {
                        cb(new Error('Sample not found: ' + sampleId));
                    }
                });
        }, callback);
    }

    _fetchMetadataForSampleVersion(versionId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample_value')
                .innerJoin('field_metadata', 'vcf_file_sample_value.field_id', 'field_metadata.id')
                .innerJoin('field_text', 'field_text.field_id', 'field_metadata.id')
                .where('vcf_file_sample_version_id', versionId)
                .asCallback((error, result) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(result));
                    }
                });
        }, callback);
    }

    _fetchFileSampleValues(sampleId, callback) {
        async.waterfall([
            (cb) => {
                this._fetchLastSampleVersionId(sampleId, cb);
            },
            (versionId, cb) => {
                this._fetchMetadataForSampleVersion(versionId, cb);
            }
        ], callback);
    }

}

module.exports = SamplesModel;