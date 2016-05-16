'use strict';

const SystemOperation = require('./SystemOperation');
const METHODS = require('../external/applicationServer/AppServerMethods');
const OperationBase = require('./OperationBase');

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
