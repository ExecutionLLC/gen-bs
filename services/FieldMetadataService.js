'use strict';

const ServiceBase = require('./ServiceBase');

const FIELD_METADATA = require('../test_data/field_metadata.json');

class FieldMetadataService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    findForUserBySampleId(user, sampleId, callback) {
        if (user) {
            callback(null, FIELD_METADATA);
        } else {
            callback(new Error('User is undefined'));
        }

    }
}