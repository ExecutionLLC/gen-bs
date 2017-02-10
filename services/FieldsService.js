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

    findSourcesFields(callback) {
        this.models.fields.findSourcesFields(callback);
    }

    findAll(callback) {
        this.models.fields.findAll(callback);
    }

    getExistingSourceNames(callback) {
        this.models.fields.getExistingSourceNames(callback);
    }

    findMany(fieldIds, callback) {
        this.models.fields.findMany(fieldIds, callback);
    }

    addMissingSourceReferences(sourcesList, callback) {
        _.each(sourcesList, (source) => {
            if (!this._findSource(source.sourceName)) {
                this.availableSources.push(source);
            }
        });
        callback(null, this.availableSources);
    }

    addSourceFields(languageId, sourceFieldsMetadata, callback) {
        // Add all non-mandatory source fields without trying to match them to existing fields.
        const fieldsMetadataToAdd = _.filter(sourceFieldsMetadata, fieldMetadata => !fieldMetadata.isMandatory);
        this.models.fields.addMany(languageId, fieldsMetadataToAdd, callback);
    }

    _findSource(sourceName) {
        return _.find(this.availableSources, (availableSource) => {
            return availableSource.sourceName === sourceName;
        });
    }

    static createFieldMetadata(sourceName, isSample, appServerFieldMetadata) {
        return {
            id: Uuid.v4(),
            name: appServerFieldMetadata.name, // Set label to name by default.
            sourceName: isSample ? 'sample' : sourceName,
            isMandatory: appServerFieldMetadata.isMandatory,
            valueType: appServerFieldMetadata.type,
            dimension: appServerFieldMetadata.num,
            text:[
                {
                    label: appServerFieldMetadata.name,
                    description: appServerFieldMetadata.desc,
                    languageId: isSample ? null : this.config.defaultLanguId,
                }
            ]
        };
    }
}

module.exports = FieldsService;
