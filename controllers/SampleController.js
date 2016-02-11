'use strict';

const multer = require('multer');

const UserEntityControllerBase = require('./UserEntityControllerBase');

class SampleController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.samples);
    }

    upload(request, response, next) {
        const sampleFiles = request.files;
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

        router.post('/upload', Upload.array('samples', 5), this.upload.bind(this));

        return router;
    }
}

module.exports = SampleController;