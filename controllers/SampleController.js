'use strict';

const multer = require('multer');

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
        this.services.samples.upload(sessionId, user, fileInfo, (error, operationId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    operationId
                });
            }
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