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
        this.timestamp = new Date(Date.now());
        this.lastAppServerMessage = null;
        this.shouldSendClose = true;
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
    
    shouldSendCloseToAppServer() {
        return this.shouldSendClose;
    }
    
    setSendCloseToAppServer(flag) {
        this.shouldSendClose = flag;
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

    toString() {
        return 'operation ' + this.getId() + ' of type ' + this.getType() + ' (created: ' + this.getTimestamp() + ')';
    }

    static operationTypes() {
        return OPERATION_TYPES;
    }
}

module.exports = OperationBase;
