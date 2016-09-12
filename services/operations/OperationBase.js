'use strict';

const Uuid = require('node-uuid');

class OperationBase {
    /**
     * @param {string}sessionId
     * @param {string}method
     * @param {string=}id
     */
    constructor(sessionId, method, id) {
        Object.assign(this, {
            id: id || Uuid.v4(),
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
        return this.constructor.name;
    }
    
    shouldSendCloseToAppServer() {
        return this.shouldSendClose;
    }
    
    setSendCloseToAppServer(flag) {
        this.shouldSendClose = flag;
    }

    /**
     * @param {AppServerOperationResult}message
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
        return 'operation ' + this.getId() + ' of type ' + this.constructor.name + ' (created: ' + this.getTimestamp() + ')';
    }
}

module.exports = OperationBase;
