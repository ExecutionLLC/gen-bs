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
    'is_analysed',
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
                        isAnalised: sample.isAnalysed,
                        sampleType: 'standart'
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

    _addNewFileSampleVersion(sampleId, fieldId, values, trx, callback) {
        async.waterfall([
            (cb) => {
                const dataToInsert = {
                    id: this._generateId(),
                    vcfFileSampleId: sampleId
                };
                this._insertTable('vcf_file_sample_version', dataToInsert, trx, cb);
            },
            (versionId, cb) => {
                const dataToInsert = {
                    vcfFileSampleVersionId: versionId,
                    fieldId: fieldId,
                    values: values
                };
                this._insertTable('vcf_file_sample_values', dataToInsert, trx, cb);
            }
        ], callback);
    }

    update(userId, sampleId, sample, callback) {
        this._fetch(userId, sampleId, (error, sampleData) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToUpdate = {
                                fileName: sample.fileName,
                                hash: sample.hash,
                                isAnalised: sample.isAnalysed,
                                sampleType: sample.sampleType
                            };
                            this._update(sampleId, dataToUpdate, trx, cb);
                        },
                        (id, cb) => {
                            this._addNewFileSampleVersion(sampleId, sample.fieldId, sample.values, trx, (error, result) => {
                                cb(error, sampleId);
                            });
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, sampleId, callback) {
        let sample = {};
        async.waterfall([
            (cb) => { this._fetch(userId, sampleId, cb); },
            (sampleData, cb) => {
                sample = sampleData;
                this._fetchFileSampleValues(sample.id, cb);
            },
            (fileSampleValues, cb) => {
                sample.vcfFileSampleVersionId = fileSampleValues.vcfFileSampleVersionId;
                sample.fieldId = fileSampleValues.fieldId;
                sample.values = fileSampleValues.values;
                cb(null, this._toJson(sample));
            }
        ], callback);
    }

    // TODO: посмотреть нужен ли подобный метод в services, скорректирровать и сделать
    //findAll(userId, callback) {
    //
    //}

    _fetchFileSampleValues(sampleId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .limit(1)
                .from('vcf_file_sample_version')
                .innerJoin('vcf_file_sample_values', 'vcf_file_sample_values.vcf_file_sample_version_id', 'vcf_file_sample_version.id')
                .orderBy('vcf_file_sample_version.timestamp', 'desc')
                .where('vcf_file_sample_id', sampleId)
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