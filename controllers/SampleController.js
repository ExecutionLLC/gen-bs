'use strict';

const async = require('async');
const multer = require('multer');
const fs = require('fs');

const UserEntityControllerBase = require('./UserEntityControllerBase');

class SampleController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.samples);
    }

    upload(request, response, next) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const sessionId = request.sessionId;

        const sampleFile = request.file;
        const fileInfo = {
            localFilePath: sampleFile.path,
            fileSize: sampleFile.size,
            originalFileName: sampleFile.originalname
        };

        async.waterfall([
            (callback) => this.services.samples.upload(sessionId, user, fileInfo, callback),
            (operationId, callback) => this._removeSampleFile(fileInfo.localFilePath, (error) => callback(error, operationId))
        ], (error, operationId) => {
            this.sendErrorOrJson(response, error, {
                operationId
            });
        });
    }

    _removeSampleFile(localFilePath, callback) {
        fs.unlink(localFilePath, (error) => {
            if (error) {
                this.services.logger.error('Error removing uploaded sample file: ' + error);
            }

            // Continue anyway.
            callback(null);
        });
    }

    createRouter() {
        const router = super.createRouter();

        const Upload = multer({
            dest: this.services.config.uploadPath,
            limits: {
                fileSize: this.services.config.uploadMaxSizeInBytes,
                files: this.services.config.uploadMaxCount
            }
        });

        // Cannot upload many samples here simultaneously, as the client
        // will be unable to distinguish upload operation ids.
        router.post('/upload', Upload.single('sample'), this.upload.bind(this));

        return router;
    }
}

module.exports = SampleController;