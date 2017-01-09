'use strict';

const SystemOperation = require('./SystemOperation');
const AppServerMethods = require('../external/applicationServer/AppServerMethods');

class UploadOperation extends SystemOperation {
    constructor(sessionId, method, id) {
        super(sessionId, method, id);
        this.setSendCloseToAppServer(true);
        this._isActive = false;
    }

    /**
     * Gets file owner.
     * 
     * @returns {string}
     * */
    getUserId() {
        return this.userId;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getSampleId() {
        return this.sampleId;
    }

    setSampleId(sampleId) {
        this.sampleId = sampleId;
    }

    getSampleFileName() {
        return this.sampleFileName;
    }

    setSampleFileName(sampleFileName) {
        this.sampleFileName = sampleFileName;
    }

    get isActive(){
        return this._isActive;
    }

    set isActive(isActive) {
        this._isActive = isActive;
    }

    static recreate(id, systemSessionId, userId, sampleId, sampleFileName) {
        const operation = new UploadOperation(systemSessionId, AppServerMethods.uploadSample, id);
        operation.setUserId(userId);
        operation.setSampleId(sampleId);
        operation.setSampleFileName(sampleFileName);
        return operation;
    }
}

module.exports = UploadOperation;
