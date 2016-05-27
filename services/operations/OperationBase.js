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
        this.lastAppServerMessage = null;
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

    /**
     * @param {AppServerResult}message
     * */
    setLastAppServerMessage(message) {
        this.lastAppServerMessage = message;
    }

    /**
     * @returns {object}message
     * */
    getLastAppServerMessage() {
        return this.lastAppServerMessage;
    }

    static operationTypes() {
        return OPERATION_TYPES;
    }
}

module.exports = OperationBase;
