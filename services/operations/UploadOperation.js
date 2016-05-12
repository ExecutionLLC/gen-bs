'use strict';

const SystemOperation = require('./SystemOperation');

class UploadOperation extends SystemOperation {
    constructor(sessionId, method) {
        super(sessionId, method);
    }

    getType() {
        return SystemOperation.operationTypes().UPLOAD;
    }
    
    /**
     * Sets file owner.
     * 
     * @param {string}userId
     * */
    setUserId(userId) {
        this.userId = userId;
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

    getSampleFileName() {
        return this.sampleFileName;
    }

    setSampleFileName(sampleFileName) {
        this.sampleFileName = sampleFileName;
    }
}

module.exports = UploadOperation;
