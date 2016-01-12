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

    add(userId, sample, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        fileName: sample.fileName,
                        hash: sample.hash,
                        isAnalized: sample.isAnalyzed,
                        sampleType: 'standard'
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (sampleId, cb) => {
                    this._addNewFileSampleVersion(sampleId, sample.fieldId, sample.values, trx, (error, result) => {
                        cb(error, sampleId);
                    });
                }
            ], cb);
        }, callback);
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
                            this._addNewFileSampleVersion(sampleId, sample.fieldId, sample.values, trx, (error) => {
                                cb(error, sampleId);
                            });
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

    _mapFileSampleValues(sample, callback) {
        this._fetchFileSampleValues(sample.id, (error, result) => {
            if (error) {
                callback(error);
            } else {
                sample.vcfFileSampleVersionId = result.vcfFileSampleVersionId;
                sample.fieldId = result.fieldId;
                sample.values = result.values;
                callback(null, this._mapColumns(sample));
            }
        });
    }

    _addNewFileSampleVersion(sampleId, fieldId, values, trx, callback) {
        async.waterfall([
            (cb) => {
                const dataToInsert = {
                    id: this._generateId(),
                    vcfFileSampleId: sampleId
                };
                this._insertIntoTable('vcf_file_sample_version', dataToInsert, trx, cb);
            },
            (versionId, cb) => {
                const dataToInsert = {
                    vcfFileSampleVersionId: versionId,
                    fieldId: fieldId,
                    values: values
                };
                this._insertIntoTable('vcf_file_sample_values', dataToInsert, trx, cb);
            }
        ], callback);
    }

    _fetchSamplesByUserId(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('creator', userId)
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

    _fetchFileSampleValues(sampleId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample_version')
                .innerJoin('vcf_file_sample_values', 'vcf_file_sample_values.vcf_file_sample_version_id', 'vcf_file_sample_version.id')
                .orderBy('vcf_file_sample_version.timestamp', 'desc')
                .where('vcf_file_sample_id', sampleId)
                .limit(1)
                .asCallback((error, result) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(result));
                    }
                });
        }, callback);
    }
}

module.exports = SamplesModel;