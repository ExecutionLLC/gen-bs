'use strict';

const SystemOperation = require('./SystemOperation');
const ApplicationServerMethods = require('../external/applicationServer/ApplicationServerMethods');
const OperationBase = require('./OperationBase');

class KeepAliveOperation extends SystemOperation {
    constructor(sessionId, operationIdToCheck) {
        super(sessionId, ApplicationServerMethods.keepAlive);

        this.operationIdToCheck = operationIdToCheck;
    }

    getOperationIdToCheck() {
        return this.operationIdToCheck;
    }
}

module.exports = KeepAliveOperation;
