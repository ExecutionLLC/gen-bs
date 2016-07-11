'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('../ServiceBase');
const OperationBase = require('./OperationBase');
const SearchOperation = require('./SearchOperation');
const UploadOperation = require('./UploadOperation');
const SystemOperation = require('./SystemOperation');
const KeepAliveOperation = require('./KeepAliveOperation');
const ReflectionUtils = require('../../utils/ReflectionUtils');

class OperationsService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.operations = Object.create(null);
    }

    addSearchOperation(sessionId, method, callback) {
        const operation = new SearchOperation(sessionId, method);
        this._addOperation(operation, callback);
    }

    addUploadOperation(method, userId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (sessionId, callback) => {
                const operation = new UploadOperation(sessionId, method, userId);
                this._addOperation(operation, callback);
            }
        ], callback);
    }

    addSystemOperation(method, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (sessionId, callback) => {
                const operation = new SystemOperation(sessionId, method);
                this._addOperation(operation, callback);
            }
        ], callback);
    }

    addKeepAliveOperation(sessionId, searchOperation, callback) {
        const operation = new KeepAliveOperation(sessionId, searchOperation.id);
        // Keep-alive operation needs to go to the same AS instance as the search operation.
        operation.setASQueryName(searchOperation.getASQueryName());
        this._addOperation(operation, callback);
    }

    findInAllSessions(operationId, callback) {
        const session = _.find(this.operations, sessionOperations => sessionOperations[operationId]);
        if (session) {
            callback(null, session[operationId]);
        } else {
            this._onOperationNotFound(callback)
        }
    }

    find(sessionId, operationId, callback) {
        const sessionOperations = this.operations[sessionId];
        if (sessionOperations) {
            const operation = sessionOperations[operationId];
            if (operation) {
                callback(null, operation);
            } else {
                this._onOperationNotFound(callback);
            }
        } else {
            this._onOperationNotFound(callback);
        }
    }

    /**
     * Finds active system operations started by the specified user.
     * Currently there can only be upload operations.
     *
     * @param {string}userId
     * @param {function(Error, Array<UploadOperation>)}callback
     * */
    findActiveOperations(userId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSessionId(callback),
            // Find upload operations of all users.
            (sessionId, callback) => this.findAllByClass(sessionId, UploadOperation, callback),
            (operations, callback) => callback(null,
                _.filter(operations, operation => operation.getUserId() === userId)
            )
        ], callback);
    }

    findAll(sessionId, callback) {
        const sessionOperations = this.operations[sessionId];
        if (sessionOperations) {
            const operations = _.filter(sessionOperations);
            callback(null, operations);
        } else {
            callback(null, []);
        }
    }

    /**
     * Finds all operations of the specified type.
     * */
    findAllByClass(sessionId, operationClass, callback) {
        async.waterfall([
            (callback) => this.findAll(sessionId, callback),
            (operations, callback) => {
                const result = _.filter(operations,
                    operation => ReflectionUtils.isSubclassOf(operation, operationClass));
                callback(null, result);
            }
        ], callback);
    }

    remove(sessionId, operationId, callback) {
        async.waterfall([
            (callback) => this.find(sessionId, operationId, callback),
            (operation, callback) => {
                this._closeOperationIfNeeded(operation, callback);
            },
            (operation, callback) => {
                this.logger.info('Removing ' + operation);
                const sessionOperations = this.operations[sessionId];
                sessionOperations && delete sessionOperations[operation.getId()];

                // Remove empty entries to keep the object clean.
                if (_.isEmpty(this.operations[sessionId])) {
                    delete this.operations[sessionId];
                }
                callback(null, operation);
            }
        ], callback);
    }

    removeAll(sessionId, callback) {
        const sessionOperations = this.operations[sessionId];
        if (sessionOperations) {
            async.each(sessionOperations, (operation, cb) => this.remove(sessionId, operation.getId(), cb), callback);
        } else {
            callback(null);
        }
    }

    _addOperation(operation, callback) {
        const sessionId = operation.getSessionId();
        this.services.logger.info('Starting ' + operation);
        const sessionOperations = this.operations[sessionId] || (this.operations[sessionId] = {});
        const operationId = operation.getId();
        sessionOperations[operationId] = operation;
        callback(null, operation);
    }

    _onOperationNotFound(callback) {
        callback(new Error('Operation is not found'));
    }

    _closeOperationIfNeeded(operation, callback) {
        if (operation.shouldSendCloseToAppServer()) {
            this.services.applicationServer.requestCloseSession(
                operation.getSessionId(),
                operation.getId(),
                (error) => callback(error, operation)
            );
        } else {
            callback(null, operation);
        }
    }
}

module.exports = OperationsService;