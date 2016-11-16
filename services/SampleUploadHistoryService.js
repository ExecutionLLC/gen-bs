'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

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



    cancelUpload(user, operationId, callback){
        this.logger.debug('Cancel uploading operationId: ' + JSON.stringify(operationId, null, 2));
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => this.services.operations.find(session, operationId, (error,operation) =>callback(error,operation, session)),
            (operation, session, callback) =>(callback) => this.services.operations.remove(session, operation.getId(), (error) => callback(error)),
        ], callback);
    }
}

module.exports = SampleUploadHistoryService;
