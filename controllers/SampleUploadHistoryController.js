'use strict';

const async = require('async');

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class SampleUploadHistoryController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.sampleUploadHistory);
    }

    findAll(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const limit = request.query.limit;
                const offset = request.query.offset;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified or incorrect'));
                } else {
                    this.services.sampleUploadHistory.findAll(user, limit, offset, callback);
                }
            }
        ], (error, items) => {
            this.sendErrorOrJson(response, error, items);
        });
    }

    add(request, response) {
        this.sendErrorOrJson(response, new Error('Method is not supported'));
    }

    update(request, response) {
        this.sendErrorOrJson(response, new Error('Method is not supported'));
    }
}

module.exports = SampleUploadHistoryController;
