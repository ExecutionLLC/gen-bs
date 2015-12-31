'use strict';

const _ = require('lodash');

const FsUtils = require('../utils/FileSystemUtils');
const FieldsMetadataService = require('../services/FieldsMetadataService');

/**
 * Imports initial data on the service start.
 * */
class InitialDataImportManager {
    constructor(services, models) {
        this.services = services;
        this.models = models;
    }

    execute() {
        const defaultsDir = __dirname + '/defaults';
        const samplesDir = defaultsDir + '/samples';
        FsUtils.forAllFiles(samplesDir, '.json', (error, files) => {
            if (error) {
                console.error(error);
                process.exit(1);
            } else {
                _.each(files, file => this._importSample(file));
            }
        });
    }

    _importSample(sampleMetadataFilePath) {
        const sampleId = this._getSampleIdFromFilePath(sampleMetadataFilePath);
        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = JSON.parse(sampleFieldsString);
        const wsMappedFields = _.map(sampleFields, sampleField => FieldsMetadataService.createFieldMetadata(sampleId, sampleField));
        console.log(wsMappedFields);
    }

    _getSampleIdFromFilePath(sampleMetadataFilePath) {
        const prefix = 'metadata_';
        const sampleFileName = FsUtils.getFileName(sampleMetadataFilePath);
        return sampleFileName.startsWith(prefix) ? sampleFileName.substr(prefix.length) : sampleFileName;
    }
}

module.exports = InitialDataImportManager;