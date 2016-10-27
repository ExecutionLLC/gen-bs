'use strict';

const multer = require('multer');
const fs = require('fs');
const async = require('async');

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class SampleController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.samples);
    }

    add(request, response) {
        this.sendInternalError(response, 'Method is not supported, use upload');
    }

    upload(request, response) {
        const {body, file} = request;
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                if (file && file.path && file.size) {
                    callback(null, file);
                } else {
                    callback(new Error('Sample file is not specified.'));
                }
            }, (sampleFile, callback) => {
                const fileName = (body && body.fileName) ? body.fileName : sampleFile.originalname;
                if (!fileName) {
                    callback(new Error('Sample has no file name.'));
                } else {
                    callback(null, sampleFile, fileName);
                }
            }, (sampleFile, fileName, callback) => {
                const fileInfo = {
                    localFilePath: sampleFile.path,
                    fileSize: sampleFile.size,
                    originalFileName: fileName
                };
                const {user, session} = request;
                this.services.samples.upload(session, user, fileInfo, (error, operationId) => {
                    // Try removing local file anyway.
                    this._removeSampleFile(fileInfo.localFilePath);
                    callback(error, operationId);
                });
            }
        ], (error, operationId) => {
            this.sendErrorOrJson(response, error, {operationId});
        });
    }

    _removeSampleFile(localFilePath) {
        fs.unlink(localFilePath, (error) => {
            if (error) {
                this.services.logger.error('Error removing uploaded sample file: ' + error);
            }
        });
    }

    createRouter() {
        const router = super.createRouter();

        const Upload = multer({
            dest: this.services.config.samplesUpload.path,
            limits: {
                fileSize: this.services.config.samplesUpload.maxSizeInBytes
            }
        });

        // Cannot upload many samples here simultaneously, as the client
        // will be unable to distinguish upload operation ids.
        router.post('/upload', Upload.single('sample'), this.upload.bind(this));

        return router;
    }
}

module.exports = SampleController;