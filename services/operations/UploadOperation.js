'use strict';

const SystemOperation = require('./SystemOperation');

class UploadOperation extends SystemOperation {
    constructor(sessionId, method, userId) {
        super(sessionId, method);
        this.setSendCloseToAppServer(true);
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
}

module.exports = UploadOperation;
