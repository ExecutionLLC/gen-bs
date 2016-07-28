'use strict';

const METHODS = require('../external/applicationServer/AppServerMethods');
const SystemOperation = require('./SystemOperation');

class KeepAliveOperation extends SystemOperation {
    constructor(sessionId, operationIdToCheck) {
        super(sessionId, METHODS.keepAlive);

        this.operationIdToCheck = operationIdToCheck;
    }

    getOperationIdToCheck() {
        return this.operationIdToCheck;
    }
}

module.exports = KeepAliveOperation;
