'use strict';

const _ = require('lodash');

const MockModelBase = require('./MockModelBase');
const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const userId = require('../test_data/user_metadata.json')[0].id;

const samplesLoadFunc = (callback) => {
    FsUtils.getAllFiles(__dirname + '/../defaults/samples/', '.json', (error, files) => {
        if (error) {
            callback(error);
        } else {
            const samples = _.map(files, (file) => FsUtils.getFileContentsAsString(file))
                .map(contents => ChangeCaseUtil.convertKeysToCamelCase(
                    JSON.parse(contents)
                ))
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