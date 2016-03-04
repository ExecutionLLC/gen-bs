'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        // TODO: Upload file to Amazon S3.
        super.add(user, languId, fileMetadata, callback);
    }

    update() {
        throw new Error('Operation is not supported');
    }
}