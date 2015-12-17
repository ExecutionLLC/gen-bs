'use strict';

const ServiceBase = require('./ServiceBase');
const FIELDS_METADATA = require('../test_data/fields_metadata.json');

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    getFieldsMetadata(user, callback) {
        callback(null, FIELDS_METADATA);
    }
}

module.exports = ApplicationServerService;
