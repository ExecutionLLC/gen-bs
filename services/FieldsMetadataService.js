'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class FieldsMetadataService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    findByUserAndSampleId(user, sampleId, callback) {
        if (user) {
            this.models.fields.findByUserAndSampleId(user.id, sampleId, callback);
        } else {
            callback(new Error('User is undefined'));
        }
    }

    import(sourceName, appServerFieldMetadataArray, callback) {
        const webServerFields = _.map(appServerFieldMetadataArray, this._createFieldMetadata);
        // TODO: here we should ignore all mandatory fields, as they should be already added.
    }

    static createFieldMetadata(sourceName, appServerFieldMetadata) {
        return {
            id: Uuid.v4(),
            name: appServerFieldMetadata.name,
            sourceName: sourceName,
            isMandatory: appServerFieldMetadata.isMandatory,
            editable: false,
            filterControlEnable: false,
            valueType: appServerFieldMetadata.type,
            description: appServerFieldMetadata.desc
        };
    }
}

module.exports = FieldsMetadataService;
