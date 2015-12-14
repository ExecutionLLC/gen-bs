'use strict';

const ServiceBase = require('./ServiceBase');
const fieldsMetadata = require('../test_data/get_filelds_metadata-result.json');

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    getFieldsMetadata(user, callback) {
        callback(null, fieldsMetadata);
    }
}

module.exports = ApplicationServerService;
