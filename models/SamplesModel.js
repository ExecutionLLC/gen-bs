'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [];

//class SamplesModel extends SecureModelBase {
//    constructor(models) {
//        super(models, 'vcf_file_sample', mappedColumns);
//    }
//}

const MockModelBase = require('./MockModelBase');
const FsUtils = require('../utils/FileSystemUtils');

const userId = require('../test_data/user_metadata.json')[0].id;

const samplesLoadFunc = (callback) => {
    FsUtils.getAllFiles(__dirname + '/../defaults/samples/', '.json', (error, files) => {
        if (error) {
            callback(error);
        } else {
            const samples = _.map(files, (file) => FsUtils.getFileContentsAsString(file))
                .map(contents => JSON.parse(contents))
                .map(sampleMetadata => sampleMetadata.sample);
            callback(null, samples);
        }
    });
};

class SamplesModel extends MockModelBase {
    constructor() {
        super(samplesLoadFunc, userId);
    }
}

module.exports = SamplesModel;