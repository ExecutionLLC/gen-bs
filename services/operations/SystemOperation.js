'use strict';

const OperationBase = require('./OperationBase');

class SystemOperation extends OperationBase {
    constructor(sessionId, method) {
        super(sessionId, method);
        this.setSendCloseToAppServer(false);
    }
}

module.exports = SystemOperation;
