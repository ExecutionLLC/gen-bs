'use strict';

const async = require('async');
const multer = require('multer');
const fs = require('fs');
const _ = require('lodash');

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class SavedFilesController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.savedFiles);
    }

    download(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const languageId = request.languId;
                const fileId = request.params.id;
                this.services.savedFiles.download(user, languageId, fileId, callback);
            }
        ], (error, readStream) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                readStream.pipe(response);
            }
        });
    }

    upload(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.parseJson(request.body.metadata, callback),
            // The file itself should be downloaded locally. Create read stream for it.
            (fileMetadata, callback) => {
                const file = (!_.isEmpty(request.files) && !_.isEmpty(request.files.file)) ?
                    request.files.file[0] : null;
                if (!file) {
                    callback(new Error('No file body is found.'));
                } else {
                    const filePath = file.path;
                    const fileStream = fs.createReadStream(filePath);
                    callback(null, fileMetadata, fileStream, filePath);
                }
            },
            (fileMetadata, fileStream, filePath, callback) => {
                const user = request.user;
                const languageId = request.languId;
                this.services.savedFiles.add(user, languageId, fileMetadata, fileStream, (error, result) => {
                    this._removeFileAsync(filePath);
                    callback(error, result);
                });
            }
        ], (error, fileMetadata) => {
            this.sendErrorOrJson(response, error, fileMetadata);
        });
    }

    update(request, response) {
        this.sendInternalError(response, 'Update is not supported');
    }

    add(request, response) {
        this.sendInternalError(response, 'Method is not supported, use upload');
    }

    _removeFileAsync(localFilePath) {
        fs.unlink(localFilePath, (error) => {
            if (error) {
                this.services.logger.error('Error removing uploaded sample file: ' + error);
            }
        });
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
        const uploadFields = [
            {
                name: 'file',
                maxCount: 1
            },
            {
                name: 'metadata'
            }
        ];
        router.post('/upload', upload.fields(uploadFields), this.upload.bind(this));
        router.get('/:id/download', this.download.bind(this));

        return router;
    }
}

module.exports = SavedFilesController;
