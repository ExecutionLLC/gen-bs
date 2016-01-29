'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'fileName',
    'hash',
    'sampleType',
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
                    cb('Some samples not found: ' + sampleIds + ', userId: ' + userId);
                }
            },
            (samples, cb) => {
                if (_.every(samples, 'creator', userId)) {
                    cb(null, samples);
                } else {
                    cb('Unauthorized access to samples: ' + sampleIds + ', userId: ' + userId);
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
    _add(userId, languId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : sample.id,
                        creator: userId,
                        fileName: sample.fileName,
                        hash: sample.hash,
                        sampleType: 'standard'
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (sampleId, cb) => {
                    this._setAnalyzed(sampleId, sample.isAnalyzed || false, trx, cb);
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
                        cb(error, sampleObj.sampleId);
                    });
                }
            ], cb);
        }, callback);
    }

    _update(userId, sample, sampleToUpdate, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToUpdate = {
                        fileName: sampleToUpdate.fileName,
                        hash: sampleToUpdate.hash,
                        sampleType: sampleToUpdate.sampleType
                    };
                    this._unsafeUpdate(sample.id, dataToUpdate, trx, cb);
                },
                (sampleId, cb) => {
                    this._setAnalyzed(sampleId, sampleToUpdate.isAnalyzed || false, trx, cb);
                },
                (sampleId, cb) => {
                    this._addNewFileSampleVersion(sampleId, trx, cb);
                },
                (versionId, cb) => {
                    this._addFileSampleValues(versionId, sampleToUpdate.values, trx, cb);
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

    _fetchLastSampleVersion(sampleId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample_version')
                .where('vcf_file_sample_id', sampleId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .asCallback((error, sampleData) => {
                    if (error || !sampleData.length) {
                        cb(error || new Error('Item not found: ' + sampleId));
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(sampleData[0]));
                    }
                });
        }, callback);
    }

    _fetchMetadataForSampleVersion(versionId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from('vcf_file_sample_value')
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
                this._fetchLastSampleVersion(sampleId, cb);
            },
            (sampleVersion, cb) => {
                this._fetchMetadataForSampleVersion(sampleVersion.id, cb);
            }
        ], callback);
    }

}

module.exports = SamplesModel;