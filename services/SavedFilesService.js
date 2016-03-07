'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.savedFiles);

        this.amazonBucketName = this.services.config.upload.amazonS3UploadBucketName;
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        // 1. Create associated metadata in database, receive id, leave transaction opened.
        // 2. Upload file to Amazon
        // 3. Commit transaction if succeeded, or rollback if failed.

        // TODO: Upload file to Amazon S3.
        super.add(user, languId, fileMetadata, callback);
    }

    update() {
        throw new Error('Operation is not supported');
    }
}