'use strict';

const METHODS = require('../external/applicationServer/AppServerMethods');
const AppServerMethods = require('../external/applicationServer/AppServerMethods');

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
        return this._type;
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

class SystemOperation extends OperationBase {
    /**
     * @param {string}sessionId
     * @param {string}method
     * @param {string=}id
     */
    constructor(sessionId, method, id) {
        super(sessionId, method, id);
        this.setSendCloseToAppServer(false);
        this._type = 'SystemOperation';
    }
}

class KeepAliveOperation extends SystemOperation {
    constructor(sessionId, operationIdToCheck) {
        super(sessionId, METHODS.keepAlive);
        this._type = 'KeepAliveOperation';
        this.operationIdToCheck = operationIdToCheck;
    }

    getOperationIdToCheck() {
        return this.operationIdToCheck;
    }
}

class SearchOperation extends OperationBase {
    constructor(sessionId, method) {
        super(sessionId, method);
        this.setSendCloseToAppServer(true);
        this._type = 'SearchOperation';
    }

    getLimit() {
        return this.limit;
    }

    setLimit(limit) {
        this.limit = limit;
    }

    getOffset() {
        return this.offset;
    }

    setOffset(offset) {
        this.offset = offset;
    }

    getSampleIds() {
        return this.sampleIds;
    }

    setSampleIds(sampleIds) {
        this.sampleIds = sampleIds;
    }

    getUserId() {
        return this.userId;
    }

    setViewId(viewId) {
        this.viewId = viewId;
    }

    getViewId() {
        return this.viewId;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setRedisParams(redisParams) {
        this.redisParams = redisParams;
    }

    getRedisParams() {
        return this.redisParams;
    }
}

class UploadOperation extends SystemOperation {
    constructor(sessionId, method, id) {
        super(sessionId, method, id);
        this.setSendCloseToAppServer(true);
        this._isActive = false;
        this._type = 'UploadOperation';
    }

    /**
     * Gets file owner.
     *
     * @returns {string}
     * */
    getUserId() {
        return this.userId;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getSampleId() {
        return this.sampleId;
    }

    setSampleId(sampleId) {
        this.sampleId = sampleId;
    }

    getSampleFileName() {
        return this.sampleFileName;
    }

    setSampleFileName(sampleFileName) {
        this.sampleFileName = sampleFileName;
    }

    get isActive(){
        return this._isActive;
    }

    set isActive(isActive) {
        this._isActive = isActive;
    }

    static recreate(id, systemSessionId, userId, sampleId, sampleFileName) {
        const operation = new UploadOperation(systemSessionId, AppServerMethods.uploadSample, id);
        operation.setUserId(userId);
        operation.setSampleId(sampleId);
        operation.setSampleFileName(sampleFileName);
        return operation;
    }
}

module.exports = {
    SearchOperation,
    KeepAliveOperation,
    SystemOperation,
    UploadOperation
};