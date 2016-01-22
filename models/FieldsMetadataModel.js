'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const FsUtils = require('../utils/FileSystemUtils');

/**
 * Loads all files for samples and sources.
 * */
const loadAllFiles = (callback) => {
    const extension = '.json';
    const defaultsFolder = __dirname + '/../defaults';
    const samplesFolder = defaultsFolder + '/samples';
    const sourcesFolder = defaultsFolder + '/sources';
    async.waterfall([
        (callback) => {
            FsUtils.getAllFiles(samplesFolder, extension, callback);
        },
        (sampleFiles, callback) => {
            FsUtils.getAllFiles(sourcesFolder, extension, (error, sourceFiles) => {
                callback(error, sampleFiles.concat(sourceFiles));
            });
        },
        (allFiles, callback) => {
            const fileContents = _(allFiles)
                .map(file => FsUtils.getFileContentsAsString(file))
                .map(contents => ChangeCaseUtil.convertKeysToCamelCase(
                    JSON.parse(contents)
                ))
                .value();
            callback(null, fileContents);
        }
    ], callback);
};

class FieldsMetadataModel {
    constructor() {
        this.sampleIdToFieldIds = {};
        this.fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require('../defaults/fields/fields-metadata.json')
        );
        this.fieldIdToFieldMetadata = _.indexBy(this.fieldsMetadata, 'id');

        loadAllFiles((error, filesContents) => {
            if (error) {
                throw new Error(error);
            }

            // Collect all the fields metadata and connect fields to sample ids.
            _.each(filesContents, fileContents => {
                const fileMetadata = fileContents.sample;
                const fieldIds = fileContents.fieldIds;
                if (!fileMetadata.isSource) {
                    //noinspection UnnecessaryLocalVariableJS
                    this.sampleIdToFieldIds[fileMetadata.id] = fieldIds;
                }
            });
        });
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        const fieldIds = this.sampleIdToFieldIds[sampleId];

        if (!fieldIds || !fieldIds.length) {
            callback(new Error('No fields found for the specified sample'));
        } else {
            const fields = _.map(fieldIds, fieldId => this.fieldIdToFieldMetadata[fieldId]);
            callback(null, fields);
        }
    }

    find(id, callback) {
        const field = this.fieldIdToFieldMetadata[id];
        if (field) {
            callback(null, field);
        } else {
            callback(new Error('Field not found'));
        }
    }

    findMany(ids, callback) {
        const fields = _.map(ids, fieldId => this.fieldIdToFieldMetadata[fieldId]);
        callback(null, fields);
    }

    findSourcesMetadata(callback) {
        const fields = _.filter(this.fieldsMetadata, (field) => field.sourceName !== 'sample');
        const requiredFields = _.filter(this.fieldsMetadata, (field) => field.isMandatory);
        callback(null, requiredFields.concat(fields));
    }

    /**
     * Returns existing field metadata if the field is already in the existingFields array.
     * Returns null, if there is no such field in existingFields array.
     * */
    static getExistingFieldOrNull(fieldMetadata, existingFields, isSourceField) {
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
}

module.exports = FieldsMetadataModel;