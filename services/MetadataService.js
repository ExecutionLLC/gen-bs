const ServiceBase = require('./ServiceBase');
class MetadataService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    find(metadataId, callback) {
        this.models.metadata.find(metadataId, callback);
    }

    findAll(callback) {
        this.models.metadata.findAll(callback);
    }
}

module.exports = MetadataService;