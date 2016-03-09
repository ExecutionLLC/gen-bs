'use strict';

const async = require('async');

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

    update(request, response) {
        this.sendInternalError(response, 'Update is not supported');
    }

    createRouter() {
        const router = super.createRouter();

        router.get('/:id/download', this.download);

        return router;
    }
}

module.exports = SavedFilesController;
