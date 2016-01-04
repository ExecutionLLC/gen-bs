'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ExtendedModelBase = require('./ExtendedModelBase');

const mappedColumns = [
    'id',
    'name',
    'source_name',
    'value_type',
    'filter_control_enable',
    'is_mandatory',
    'is_editable',
    'is_invisible',
    'is_multi_select',
    'langu_id',
    'description'
];

//class FieldsMetadataModel extends ExtendedModelBase {
//    constructor(models) {
//        super(models, 'field_metadata', mappedColumns);
//    }
//}

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
}

module.exports = FieldsMetadataModel;