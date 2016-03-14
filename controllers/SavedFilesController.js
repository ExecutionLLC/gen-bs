'use strict';

const async = require('async');
const multer = require('multer');
const fs = require('fs');

const UserEntityControllerBase = require('./UserEntityControllerBase');

class SavedFilesController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.savedFiles);
    }

    download(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const languId = request.languId;
                const fileId = request.params.id;
                this.services.savedFiles.download(user, languId, fileId, callback);
            }
        ], (error, readStream) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                readStream.pipe(response);
            }
        });
    }

    add(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            // File metadata should lay in the request body.
            (callback) => this.getRequestBody(request, callback),
            // The file itself should be downloaded locally. Create read stream for it.
            (fileMetadata, callback) => {
                if (!fileMetadata.file) {
                    callback(new Error('No file body is found.'));
                } else {
                    const filePath = fileMetadata.file.value.path;
                    const fileStream = fs.createReadStream(filePath);
                    callback(null, fileMetadata, fileStream);
                }
            },
            (fileMetadata, fileStream, callback) => {
                const user = request.user;
                const languId = request.languId;
                this.services.savedFiles.add(user, languId, fileMetadata, fileStream, callback);
            }
        ], (error, fileMetadata) => {
            this.sendErrorOrJson(response, error, fileMetadata);
        });
    }

    update(request, response) {
        this.sendInternalError(response, 'Update is not supported');
    }

    createRouter() {
        const router = super.createRouter();

        const upload = multer({
            dest: this.services.config.savedFilesUpload.path,
            limits: {
                fileSize: this.services.config.savedFilesUpload.maxSizeInBytes,
                files: this.services.config.savedFilesUpload.maxCount
            }
        });
        router.post('/', upload.single(), this.add.bind(this));
        router.get('/:id/download', this.download);

        return router;
    }
}

module.exports = SavedFilesController;
