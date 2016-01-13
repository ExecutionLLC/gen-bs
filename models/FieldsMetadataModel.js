'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const FsUtils = require('../utils/FileSystemUtils');

const loadFieldsMetadataFunc = (callback) => {
    FsUtils.getAllFiles(__dirname + '/../defaults/samples/', '.json', (error, files) => {
        if (error) {
            callback(error);
        } else {
            const fieldsArrays = _.map(files, (file) => FsUtils.getFileContentsAsString(file))
                .map(contents => JSON.parse(contents))
                .map(sampleMetadata => sampleMetadata.fields);
            const fields = _.flatten(fieldsArrays);
            callback(null, fields);
        }
    });
};

class FieldsMetadataModel {
    constructor() {
        loadFieldsMetadataFunc((error, fields) => {
            if (error) {
                throw new Error(error);
            }
            this.fields = fields;
        });
    }

    findByUserAndSampleId(userId, sampleId, callback) {
        const fields = _.filter(this.fields, field => field.sourceName === sampleId);
        if (!fields || !fields.length) {
            callback(new Error('No fields found for the specified sample'));
        } else {
            callback(null, fields);
        }
    }

    addWithId(field, callback) {
        this.fields.push(field);
        callback(null, field);
    }

    add(field, callback) {
        field.id = Uuid.v4();
        this.fields.push(field);
        callback(null, field);
    }

    find(id, callback) {
        const field = _.find(this.fields, field => field.id === id);
        if (field) {
            callback(null, field);
        } else {
            callback(new Error('Field not found'));
        }
    }

    findMany(ids, callback) {
        const fields = _.filter(this.fields, (field) => _.any(ids, fieldId => field.id === fieldId));
        callback(null, fields);
    }
}

module.exports = FieldsMetadataModel;