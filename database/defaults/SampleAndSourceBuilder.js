'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const FsUtils = require('../scripts/utils/FileSystemUtils');
const ChangeCaseUtil = require('../scripts/utils/ChangeCaseUtil');


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
                this._buildFieldsMetadata(fieldsMetadata, callback);
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
                this._storeFieldsMetadata(fieldsMetadata, callback);
            }
        ], callback);
    }

    _buildFieldsMetadata(fieldsMetadata, callback) {
        async.map(fieldsMetadata, (fieldMetadata, callback) => {
            async.waterfall([
                (callback) => {
                    if (fieldMetadata.availableValues
                        && fieldMetadata.availableValues.length
                        && !fieldMetadata.isEditable) {
                        callback(new Error('Available values allowed only for editable fields'));
                    } else {
                        callback(null);
                    }
                },
                (callback) => {
                    const metadata = {
                        id: fieldMetadata.id,
                        name: fieldMetadata.name,
                        label: fieldMetadata.label,
                        sourceName: fieldMetadata.sourceName,
                        isEditable: fieldMetadata.isEditable,
                        isMandatory: fieldMetadata.isMandatory,
                        valueType: fieldMetadata.valueType,
                        description: fieldMetadata.description,
                        dimension: fieldMetadata.dimension
                    };
                    callback(null, metadata);
                },
                (metadata, callback) => {
                    if (fieldMetadata.availableValues) {
                        metadata.availableValues = _.map(fieldMetadata.availableValues, (availableValue) => {
                            return {
                                id: Uuid.v4(),
                                languId: availableValue.languId,
                                value: availableValue.value
                            }
                        });
                    }
                    callback(null, metadata);
                }
            ], callback);
        }, callback);
    }

    _loadRequiredAndEditableFields(callback) {
        const requiredFields = ChangeCaseUtil.convertKeysToCamelCase(require(this.requiredFieldsFile));
        const editableFields = ChangeCaseUtil.convertKeysToCamelCase(require(this.editableFieldsFile));
        const vepFields = ChangeCaseUtil.convertKeysToCamelCase(require(this.vepFieldsFile));
        callback(null, requiredFields.concat(editableFields).concat(vepFields));
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
                if (!sampleFiles.length) {
                    return callback(null);
                }
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

    _storeFieldsMetadata(fieldsMetadata, callback) {
        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.fieldMetadataDir, callback);
            },
            (callback) => {
                const filePath = this.fieldMetadataFile;
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
            type: sampleTemplate.type,
            isAnalyzed: true,
            isSource: !isSample,
            creator: null
        };
        const sourceName = (isSample) ? sample.id : sampleName;

        // Convert metadata into WS format.
        const wsMappedFields = _.map(
            sampleTemplate.fields,
            sampleField => this.createFieldMetadata(sourceName, isSample, sampleField)
        );

        // Now build sample to fields connection and list of unique fields.
        const sampleFieldIds = [];
        _.each(wsMappedFields, fieldMetadata => {
            const existingField = this.getExistingFieldOrNull(fieldMetadata, fieldsMetadata, !isSample);
            if (existingField) {
                sampleFieldIds.push(existingField.id);
            } else {
                fieldsMetadata.push(fieldMetadata);
                sampleFieldIds.push(fieldMetadata.id);
            }
        });
        // Add editable fields for samples.
        if (isSample) {
            const editableFieldsIds = _(fieldsMetadata)
                .filter('isEditable', true)
                .map('id')
                .value();
            sampleFieldIds.push.apply(sampleFieldIds, editableFieldsIds);
        }
        this._storeSampleMetadata(sample, sampleFieldIds, outputDir, callback);
    }

    /**
     * Converts keys to snake_case and stringifies the result.
     * */
    _getObjectStringToSave(obj) {
        const convertedObj = ChangeCaseUtil.convertKeysToSnakeCase(obj);
        return JSON.stringify(convertedObj, null, 2);
    }

    getExistingFieldOrNull(fieldMetadata, existingFields, isSourceField) {
        const existingField = _.find(existingFields,
            field => field.name === fieldMetadata.name
            && field.valueType === fieldMetadata.valueType
            && field.dimension === fieldMetadata.dimension
        );
        const shouldAddField =
            (isSourceField && (!fieldMetadata.isMandatory || !existingField)) // Should add copies of all non-mandatory source fields
            || (!isSourceField && !existingField); // Should only add sample fields if there is no existing field.

        if (shouldAddField) {
            return null;
        } else {
            return existingField;
        }
    }

    createFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
        return {
            id: Uuid.v4(),
            name: appServerFieldMetadata.name,
            label: appServerFieldMetadata.name, // Set label to name by default.
            sourceName: isSample ? 'sample' : sourceName,
            isMandatory: appServerFieldMetadata.isMandatory,
            isEditable: false,
            valueType: appServerFieldMetadata.type,
            description: appServerFieldMetadata.desc,
            dimension: appServerFieldMetadata.num
        };
    }
}

module.exports = new SampleAndSourceBuilder();
