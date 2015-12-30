'use strict';

const _ = require('lodash');

const FsUtils = require('../utils/FileSystemUtils');
const FieldsMetadataService = require('../services/FieldsMetadataService'); // Here lays the mapping function.

const DefaultsBuilderBase = require('./DefaultsBuilderBase');

class SampleBuilder extends DefaultsBuilderBase {
    constructor() {
        super();
        this.build = this.build.bind(this);
    }

    build(callback) {
        FsUtils.createDirectoryIfNotExists(this.samplesDir, (error) => {
            if (error) {
                callback(error);
            } else {
                this._removeJsonFilesFromDirectory(this.samplesDir, (error) => {
                    if (error) {
                        callback(error);
                    } else {
                        FsUtils.getAllFiles(this.asSamplesDir, '.json', (error, sampleFiles) => {
                            if (error) {
                                callback(error);
                            } else {
                                let filesLeft = sampleFiles.length;
                                _.each(sampleFiles, sampleMetadataPath => {
                                    this._importSample(sampleMetadataPath, (error) => {
                                        if (error) {
                                            callback(error);
                                        } else {
                                            filesLeft--;
                                            if (!filesLeft) {
                                                callback(null);
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    _getSampleIdFromFilePath(sampleMetadataFilePath) {
        const prefix = 'metadata_';
        const sampleFileName = FsUtils.getFileName(sampleMetadataFilePath, '.json');
        return sampleFileName.startsWith(prefix) ? sampleFileName.substr(prefix.length) : sampleFileName;
    }

    _storeSampleFieldMetadata(sample, sampleFieldMetadata, callback) {
        const contents = {
            sample: sample,
            fields: sampleFieldMetadata
        };
        const filePath = this.samplesDir + '/' + this._getSampleIdFromFilePath(sample.id) + '.json';
        FsUtils.writeStringToFile(filePath, JSON.stringify(contents, null, 2), callback);
    }

    _importSample(sampleMetadataFilePath, callback) {
        const sampleId = this._getSampleIdFromFilePath(sampleMetadataFilePath);
        const sample = {
            id: sampleId,
            fileName: sampleId,
            hash: null,
            sampleType: 'standard', // TODO: load sample types somewhere.
            isAnalyzed: true,
            creator: null
        };

        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = JSON.parse(sampleFieldsString);
        const wsMappedFields = _.map(sampleFields, sampleField => FieldsMetadataService.createFieldMetadata(sampleId, sampleField));
        this._storeSampleFieldMetadata(sample, wsMappedFields, callback);
    }
}

module.exports = new SampleBuilder();
