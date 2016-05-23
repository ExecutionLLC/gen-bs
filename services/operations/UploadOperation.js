'use strict';

const SystemOperation = require('./SystemOperation');

class UploadOperation extends SystemOperation {
    constructor(sessionId, method, userId) {
        super(sessionId, method);
        this.userId = userId;
    }

    getType() {
        return SystemOperation.operationTypes().UPLOAD;
    }

    /**
     * Gets file owner.
     * 
     * @returns {string}
     * */
    getUserId() {
        return this.userId;
    }

    getSampleId() {
        return this.sampleId;
    }

    setSampleId(sampleId) {
        this.sampleId = sampleId;
    }

    /**
     * @param {AppServerResult}message
     * */
    setLastAppServerMessage(message) {
        this.lastAppServerMessage = message;
    }
    
    /**
     * @returns {object}message
     * */
    getLastAppServerMessage() {
        return this.lastAppServerMessage;
    }

    getSampleFileName() {
        return this.sampleFileName;
    }

    setSampleFileName(sampleFileName) {
        this.sampleFileName = sampleFileName;
    }
}

module.exports = UploadOperation;
