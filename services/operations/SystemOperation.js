'use strict';

const OperationBase = require('./OperationBase');

class SystemOperation extends OperationBase {
    constructor(sessionId, method) {
        super(sessionId, method);
    }
}

module.exports = SystemOperation;
