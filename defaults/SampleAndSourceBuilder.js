'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const FsUtils = require('../utils/FileSystemUtils');
const FieldsMetadataService = require('../services/FieldsMetadataService'); // Here lays the mapping function.

const DefaultsBuilderBase = require('./DefaultsBuilderBase');

class SampleBuilder extends DefaultsBuilderBase {
    constructor() {
        super();
        this.build = this.build.bind(this);
    }

    build(callback) {
        async.waterfall([
            (callback) => {
                this._buildMetadata(this.asSamplesDir, this.samplesDir, false, callback);
            },
            (callback) => {
                this._buildMetadata(this.asSourcesDir, this.sourcesDir, true, callback);
            }
        ], callback);
    }

    _buildMetadata(asMetadataTemplatesDir, targetDir, useSourceName, callback) {
        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(targetDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(targetDir, callback);
            },
            (callback) => {
                FsUtils.getAllFiles(asMetadataTemplatesDir, '.json', callback);
            },
            (sampleFiles, callback) => {
                let filesLeft = sampleFiles.length;
                _.each(sampleFiles, sampleMetadataPath => {
                    this._importSample(sampleMetadataPath, targetDir, useSourceName, (error) => {
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
        ], callback);
    }

    _getIdFromFilePath(sampleMetadataFilePath) {
        const prefix = 'metadata_';
        const sampleFileName = FsUtils.getFileName(sampleMetadataFilePath, '.json');
        return sampleFileName.startsWith(prefix) ? sampleFileName.substr(prefix.length) : sampleFileName;
    }

    _storeFieldMetadata(sample, sampleFieldMetadata, outputDir, callback) {
        const contents = {
            sample: sample,
            fields: sampleFieldMetadata
        };
        const filePath = outputDir + '/' + sample.fileName + '.json';
        FsUtils.writeStringToFile(filePath, JSON.stringify(contents, null, 2), callback);
    }

    _importSample(sampleMetadataFilePath, outputDir, useSourceName, callback) {
        const sampleName = this._getIdFromFilePath(sampleMetadataFilePath);
        const sample = {
            id: Uuid.v4(),
            fileName: sampleName,
            hash: null,
            sampleType: 'standard', // TODO: load sample types somewhere.
            isAnalyzed: true,
            creator: null
        };

        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = JSON.parse(sampleFieldsString);
        const sourceName = (useSourceName) ? sampleName : sample.id;
        const wsMappedFields = _.map(
            sampleFields,
            sampleField => FieldsMetadataService.createFieldMetadata(sourceName, sampleField)
        );
        this._storeFieldMetadata(sample, wsMappedFields, outputDir, callback);
    }
}

module.exports = new SampleBuilder();
