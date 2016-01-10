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
            let vcfFileSampleId;

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
                    vcfFileSampleId = sampleId;
                    const dataToInsert = {
                        id: this._generateId(),
                        vcfFileSampleId: sampleId
                    };
                    this._insertTable('vcf_file_sample_version', dataToInsert, trx, cb);
                },
                (versionId, cb) => {
                    const dataToInsert = {
                        vcfFileSampleVersionId: versionId,
                        fieldId: sample.fieldId,
                        values: sample.values
                    };
                    this._insertTable('vcf_file_sample_values', dataToInsert, trx, (error, result) => {
                        cb(error, vcfFileSampleId);
                    });
                }
            ], cb);
        }, callback);
    }

    update(userId, sampleId, sample, callback) {

    }

    find(id, callback) {

    }

    findAll(userId, callback) {

    }
}

//const MockModelBase = require('./MockModelBase');
//const FsUtils = require('../utils/FileSystemUtils');
//
//const userId = require('../test_data/user_metadata.json')[0].id;
//
//const samplesLoadFunc = (callback) => {
//    FsUtils.getAllFiles(__dirname + '/../defaults/samples/', '.json', (error, files) => {
//        if (error) {
//            callback(error);
//        } else {
//            const samples = _.map(files, (file) => FsUtils.getFileContentsAsString(file))
//                .map(contents => JSON.parse(contents))
//                .map(sampleMetadata => sampleMetadata.sample);
//            callback(null, samples);
//        }
//    });
//};
//
//class SamplesModel extends MockModelBase {
//    constructor() {
//        super(samplesLoadFunc, userId);
//    }
//}

module.exports = SamplesModel;