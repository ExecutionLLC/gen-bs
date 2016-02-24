'use strict';

const _ = require('lodash');
const async = require('async');

const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class FieldsMetadataService extends ServiceBase {
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

    find(fieldId, callback) {
        this.models.fields.find(fieldId, callback);
    }

    findSourcesMetadata(callback) {
        this.models.fields.findSourcesMetadata(callback);
    }

    getExistingSourceNames(callback) {
        this.models.fields.getExistingSourceNames(callback);
    }

    findMany(fieldIds, callback) {
        this.models.fields.findMany(fieldIds, callback);
    }

    addSourceReferences(sourcesList, callback) {
        _.each(sourcesList, (source) => {
            if (!this._findSourceReference(source.sourceName)) {
                this.availableSources.push(source);
            }
        });
        callback(null, this.availableSources);
    }

    _findSourceReference(sourceName) {
        return _.find(this.availableSources, (availableSource) => {
            return availableSource.sourceName === sourceName;
        });
    }

    static createFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
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

module.exports = FieldsMetadataService;
