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

    findMany(fieldIds, callback) {
        this.models.fields.findMany(fieldIds, callback);
    }

    addSourceReferences(sourcesList, callback) {
        async.map(sourcesList, (source, callback) => {
            this.addSourceReference(source, callback);
        }, callback);
    }

    addSourceReference(source, callback) {
        async.waterfall([
            (callback) => this.findSourceReference(source.name, callback),
            (findedSource, callback) => {
                if (findedSource) {
                    callback(new Error('Cannot add source reference. Source ' + source.name + 'already exists.'));
                } else {
                    this.availableSources.push(source);
                    callback(null, source);
                }
            }
        ], callback);
    }

    findSourceReference(sourceName, callback) {
        callback(null, _.find(this.availableSources, (availableSource) => {
            return availableSource.sourceName === sourceName;
        }));
    }

    findReferenceSources(referenceName, callback) {
        callback(null, _.filter(this.availableSources, (availableSource) => {
            return availableSource.reference === referenceName;
        }));
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
