'use strict';

const async = require('async');
const _ = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const {SAMPLE_UPLOAD_STATUS} =  require('../utils/Enums');

class SampleUploadHistoryService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.sampleUploadHistory);
    }

    countActive(user, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.models.sampleUploadHistory.countActive(user.id, callback)
        ], callback);
    }

    findAll(user, limit, offset, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.models.sampleUploadHistory.findAll(user.id, limit, offset, callback)
        ], callback);
    }

    findNotFinishedUploads(user, limit, offset, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.models.sampleUploadHistory.findNotFinishedUploads(user.id, limit, offset, callback)
        ], callback);
    }

    findActive(user, callback) {
        if (user && this.services.users.isDemoUserId(user.id)) {
            callback(null, []);
        } else {
            async.waterfall([
                (callback) => this._checkUserIsSet(user, callback),
                (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
                (callback) => this.models.sampleUploadHistory.findActive(user.id, callback)
            ], callback);
        }
    }

    findActiveForAllUsers(entryId, callback) {
        this.models.sampleUploadHistory.findActiveForAllUsers(entryId, callback);
    }

    findBySampleId(userId, sampleId, callback) {
        this.models.sampleUploadHistory.findBySampleId(userId, sampleId, callback);
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
                        if(item && !_.includes([SAMPLE_UPLOAD_STATUS.READY,SAMPLE_UPLOAD_STATUS.ERROR],item.status)){
                            this.cancelUpload(user, item.id, callback);
                        }else {
                            callback(null,null);
                        }
                    }
                ],(error) => callback(error, item));
            },
        ], callback);
    }



    cancelUpload(user, operationId, callback){
        this.logger.debug('Cancel uploading operationId: ' + JSON.stringify(operationId, null, 2));
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => this.services.operations.remove(session, operationId, (error) => callback(error)),
            (callback) => this.services.applicationServerUpload.toggleNextOperation(operationId, callback)
        ], callback);
    }
}

module.exports = SampleUploadHistoryService;
