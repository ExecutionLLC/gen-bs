'use strict';

const async = require('async');
const {SAMPLE_UPLOAD_STATUS} = require('../utils/Enums');
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

    remove(user, itemId, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.find(user, itemId, callback),
            (item, callback) => this.theModel.remove(user.id, itemId, (error) => callback(error, item)),
            (item, callback) => {
                async.waterfall([
                    (callback) => this.services.sessions.findSystemSession(callback),
                    (session, callback) => {
                        if(history && !_.includes([SAMPLE_UPLOAD_STATUS.READY,SAMPLE_UPLOAD_STATUS.ERROR],item.status)){
                            this.cancelUpload(session, user, item.id, callback);
                        }else {
                            callback(null,null);
                        }
                    }
                ],(error) => callback(error, item));
            },
        ], callback);
    }

    add(request, response) {
        this.sendErrorOrJson(response, new Error('Method is not supported'));
    }

    update(request, response) {
        this.sendErrorOrJson(response, new Error('Method is not supported'));
    }
}

module.exports = SampleUploadHistoryController;
