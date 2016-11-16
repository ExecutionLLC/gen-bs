'use strict';

const OperationBase = require('./OperationBase');

class SystemOperation extends OperationBase {
    /**
     * @param {string}sessionId
     * @param {string}method
     * @param {string=}id
     */
    constructor(sessionId, method, id) {
        super(sessionId, method, id);
        this.setSendCloseToAppServer(false);
    }
}

module.exports = SystemOperation;
