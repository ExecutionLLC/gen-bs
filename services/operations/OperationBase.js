'use strict';

const Uuid = require('node-uuid');

const OPERATION_TYPES = {
    SYSTEM: 'system',
    SEARCH: 'search',
    UPLOAD: 'upload'
};

class OperationBase {
    constructor(sessionId, method) {
        Object.assign(this, {
            id: Uuid.v4(),
            method,
            sessionId,
            timestamp: new Date(Date.now()),
            lastAppServerMessage: null,
            shouldSendClose: true,
            appServerQueryName: null
        });
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

    getASQueryName() {
        return this.appServerQueryName;
    }

    setASQueryName(queryName) {
        this.appServerQueryName = queryName;
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
