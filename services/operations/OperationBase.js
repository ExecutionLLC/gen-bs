'use strict';

const Uuid = require('node-uuid');

const OPERATION_TYPES = {
    SYSTEM: 'system',
    SEARCH: 'search',
    UPLOAD: 'upload'
};

class OperationBase {
    constructor(sessionId, method) {
        this.id = Uuid.v4();
        this.method = method;
        this.sessionId = sessionId;
        this.timestamp = Date.now();
    }

    getTimestamp() {
        return this.timestamp;
    }

    /**@returns {string}*/
    getId() {
        return this.id;
    }

    getSessionId() {
        return this.sessionId;
    }

    getMethod() {
        return this.method;
    }

    /**@returns {string}*/
    getType() {
        throw new Error('Method is not implemented');
    }

    static operationTypes() {
        return OPERATION_TYPES;
    }
}

module.exports = OperationBase;
