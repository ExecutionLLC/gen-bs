'use strict';

const _ = require('lodash');
const async = require('async');

const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class FieldsService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
        this.availableSources = [];
    }

    findByUserAndSampleId(user, sampleId, callback) {
        if (user) {
            this.models.fields.findByUserAndSampleId(user.id, sampleId, callback);
        } else {
            callback(new Error('User is undefined'));
        }
    }

    findByUserAndSampleIds(user, sampleIds, callback) {
        if (user) {
            this.models.fields.findByUserAndSampleIds(user.id, sampleIds, callback);
        } else {
            callback(new Error('User is undefined'));
        }
    }

    find(fieldId, callback) {
        this.models.fields.find(fieldId, callback);
    }

    findAll(callback) {
        this.models.fields.findAll(callback);
    }

    findMany(fieldIds, callback) {
        this.models.fields.findMany(fieldIds, callback);
    }

    createFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
        return {
            id: Uuid.v4(),
            name: appServerFieldMetadata.name, // Set label to name by default.
            sourceName: isSample ? 'sample' : sourceName,
            isMandatory: appServerFieldMetadata.isMandatory,
            valueType: appServerFieldMetadata.type,
            dimension: appServerFieldMetadata.num,
            text: [
                {
                    label: appServerFieldMetadata.name,
                    description: appServerFieldMetadata.desc,
                    languageId: isSample ? null : this.config.defaultLanguId
                }
            ]
        };
    }
}

module.exports = FieldsService;
