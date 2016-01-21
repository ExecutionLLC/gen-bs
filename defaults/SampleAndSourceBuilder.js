'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const FieldsMetadataService = require('../services/FieldsMetadataService'); // Here lays the mapping function.
const FieldsMetadataModel = require('../models/FieldsMetadataModel'); // Here is the metadata equality check.

const DefaultsBuilderBase = require('./DefaultsBuilderBase');

/**
 * Produces the following results:
 * - metadata of all fields, including required and editable fields.
 * - samples to fields mappings (which sample contains which fields).
 * */
class SampleAndSourceBuilder extends DefaultsBuilderBase {
    constructor() {
        super();
        this.build = this.build.bind(this);
    }

    build(callback) {
        // Source and sample metadata has the same format.
        // Fields metadata array below will be filling during samples and sources processing.
        async.waterfall([
            (callback) => {
                this._loadRequiredAndEditableFields(callback);
            },
            (fieldsMetadata, callback) => {
                this._buildMetadata(this.asSamplesDir, this.samplesDir, true, fieldsMetadata, (error) => {
                    callback(error, fieldsMetadata);
                });
            },
            (fieldsMetadata, callback) => {
                this._buildMetadata(this.asSourcesDir, this.sourcesDir, false, fieldsMetadata, (error) => {
                    callback(error, fieldsMetadata);
                });
            },
            (fieldsMetadata, callback) => {
                this._storeFieldsMetadata(fieldsMetadata, this.fieldMetadataDir, callback);
            }
        ], callback);
    }

    _loadRequiredAndEditableFields(callback) {
        const requiredFields = ChangeCaseUtil.convertKeysToCamelCase(require(this.requiredFieldsFile));
        const editableFields = ChangeCaseUtil.convertKeysToCamelCase(require(this.editableFieldsFile));
        callback(null, requiredFields.concat(editableFields));
    }

    _buildMetadata(asMetadataTemplatesDir, targetDir, isSample, fieldsMetadata, callback) {
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
                    this._importSample(sampleMetadataPath, targetDir, isSample, fieldsMetadata, (error) => {
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

    _getNameFromFilePath(sampleMetadataFilePath) {
        const prefix = 'metadata_';
        const sampleFileName = FsUtils.getFileName(sampleMetadataFilePath, '.json');
        return sampleFileName.startsWith(prefix) ? sampleFileName.substr(prefix.length) : sampleFileName;
    }

    _storeSampleMetadata(sample, sampleFieldIds, outputDir, callback) {
        const contents = {
            sample: sample,
            fieldIds: sampleFieldIds
        };
        const filePath = outputDir + '/' + sample.fileName + '.json';
        FsUtils.writeStringToFile(filePath, this._getObjectStringToSave(contents), callback);
    }

    _storeFieldsMetadata(fieldsMetadata, outputDir, callback) {
        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(outputDir, callback);
            },
            (callback) => {
                const filePath = outputDir + '/' + 'fields-metadata.json';
                FsUtils.writeStringToFile(filePath, this._getObjectStringToSave(fieldsMetadata), callback);
            }
        ], callback);
    }

    _importSample(sampleMetadataFilePath, outputDir, isSample, fieldsMetadata, callback) {
        const sampleName = this._getNameFromFilePath(sampleMetadataFilePath);
        const sampleTemplateString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleTemplate = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(sampleTemplateString));
        const sample = {
            id: Uuid.v4(),
            fileName: sampleName,
            hash: null,
            reference: sampleTemplate.reference,
            sampleType: sampleTemplate.sampleType,
            isAnalyzed: true,
            isSource: !isSample,
            creator: null
        };
        const sourceName = (isSample) ? sample.id : sampleName;

        // Convert metadata into WS format.
        const wsMappedFields = _.map(
            sampleTemplate.fields,
            sampleField => FieldsMetadataService.createFieldMetadata(sourceName, isSample, sampleField)
        );

        // Now build sample to fields connection and list of unique fields.
        const sampleFieldIds = [];
        _.each(wsMappedFields, fieldMetadata => {
            const existingField = FieldsMetadataModel.getExistingFieldOrNull(fieldMetadata, fieldsMetadata, !isSample);
            if (existingField) {
                sampleFieldIds.push(existingField.id);
            } else {
                fieldsMetadata.push(fieldMetadata);
                sampleFieldIds.push(fieldMetadata.id);
            }
        });
        this._storeSampleMetadata(sample, sampleFieldIds, outputDir, callback);
    }

    /**
     * Converts keys to snake_case and stringifies the result.
     * */
    _getObjectStringToSave(obj) {
        const convertedObj = ChangeCaseUtil.convertKeysToSnakeCase(obj);
        return JSON.stringify(convertedObj, null, 2);
    }
}

module.exports = new SampleAndSourceBuilder();
