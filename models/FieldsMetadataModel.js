'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

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
                .map(contents => JSON.parse(contents))
                .value();
            callback(null, fileContents);
        }
    ], callback);
};

const addFieldMetadataIfNeededAndReturnId = (fieldMetadata, isSource, existingFields) => {
    const existingField = _.find(existingFields,
        field => field.name === fieldMetadata.name
            && field.valueType === fieldMetadata.valueType
            && field.dimension === fieldMetadata.dimension
    );
    const shouldAddField =
        (isSource && (!fieldMetadata.isMandatory || !existingField)) // Should add copies of all non-mandatory source fields
        || (!isSource && !existingField); // Should only add sample fields if there is no existing field.
    if (shouldAddField) {
        fieldMetadata.sourceName = isSource ? fieldMetadata.sourceName : 'sample';
        existingFields.push(fieldMetadata);
        return fieldMetadata.id;
    } else {
        return existingField.id;
    }
};

class FieldsMetadataModel {
    constructor() {
        this.sampleIdToFieldIds = {};
        this.fieldIdToFieldMetadata = {};
        this.fieldsMetadata = [];

        loadAllFiles((error, filesContents) => {
            if (error) {
                throw new Error(error);
            }

            // Collect all the fields metadata and connect fields to sample ids.
            _.each(filesContents, fileContents => {
                const fileMetadata = fileContents.sample;
                const fieldsMetadata = fileContents.fields;

                if (!fileMetadata.isSource) {
                    const sampleId = fileMetadata.id;
                    //noinspection UnnecessaryLocalVariableJS
                    const sampleFieldsIds = _.map(fieldsMetadata, (fieldMetadata) => addFieldMetadataIfNeededAndReturnId(fieldMetadata, fileMetadata.isSource, this.fieldsMetadata));
                    this.sampleIdToFieldIds[sampleId] = sampleFieldsIds;
                } else {
                    // just add source metadata to the list.
                    _.each(fieldsMetadata, fieldMetadata => addFieldMetadataIfNeededAndReturnId(fieldMetadata, true, this.fieldsMetadata));
                }
            });
            // Create hash with fields metadata.
            _.each(this.fieldsMetadata, fieldMetadata => this.fieldIdToFieldMetadata[fieldMetadata.id] = fieldMetadata);
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
}

module.exports = FieldsMetadataModel;