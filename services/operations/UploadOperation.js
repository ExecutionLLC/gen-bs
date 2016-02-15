'use strict';

const OperationBase = require('./OperationBase');

class UploadOperation extends OperationBase {
    constructor(sessionId, method) {
        super(sessionId, method);
    }

    getType() {
        return OperationBase.operationTypes().UPLOAD;
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
