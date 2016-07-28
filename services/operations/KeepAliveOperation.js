'use strict';

const METHODS = require('../external/applicationServer/AppServerMethods');
const OperationBase = require('./OperationBase');

class KeepAliveOperation extends OperationBase {
    constructor(sessionId, operationIdToCheck) {
        super(sessionId, METHODS.keepAlive);

        this.operationIdToCheck = operationIdToCheck;
    }

    getOperationIdToCheck() {
        return this.operationIdToCheck;
    }
}

module.exports = KeepAliveOperation;
