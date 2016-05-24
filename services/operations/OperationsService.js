'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('../ServiceBase');
const OperationBase = require('./OperationBase');
const SearchOperation = require('./SearchOperation');
const UploadOperation = require('./UploadOperation');
const SystemOperation = require('./SystemOperation');
const KeepAliveOperation = require('./KeepAliveOperation');

const OPERATION_TYPES = {
    SYSTEM: 'system',
    SEARCH: 'search',
    UPLOAD: 'upload'
};

class OperationsService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.operations = {};
    }

    operationTypes() {
        return OperationBase.operationTypes();
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

    addKeepAliveOperation(sessionId, sessionIdToCheck, callback) {
        const operation = new KeepAliveOperation(sessionId, sessionIdToCheck);
        this._addOperation(operation, callback);
    }

    /**
     * Checks that the operation by id has requested type.
     *
     * @param {string}sessionId Id of the session holding the operation.
     * @param {string}operationId Id of the operation to check.
     * @param {string}operationType
     * @param {function(Error)}callback
     */
    ensureOperationOfType(sessionId, operationId, operationType, callback) {
        async.waterfall([
            (callback) => this.find(sessionId, operationId, callback),
            (operation, callback) => {
                if (operation.getType() === operationType) {
                    callback(null);
                } else {
                    callback(
                        new Error('Expected operation type: ' + operationType + ', found: ' + operation.getType())
                    );
                }
            }
        ], callback);
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
            (sessionId, callback) => this.findAllByType(sessionId, OPERATION_TYPES.UPLOAD, callback),
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
    findAllByType(sessionId, operationType, callback) {
        async.waterfall([
            (callback) => this.findAll(sessionId, callback),
            (operations, callback) => {
                const result = _.filter(operations, operation => operation.getType() === operationType);
                callback(null, result);
            }
        ], callback);
    }

    remove(sessionId, operationId, callback) {
        async.waterfall([
            (callback) => this.find(sessionId, operationId, callback),
            (operation, callback) => {
                if (operation.getType() === OPERATION_TYPES.SEARCH || operation.getType() === OPERATION_TYPES.UPLOAD) {
                    this.services.applicationServer.requestCloseSession(
                        operation.getSessionId(),
                        operation.getId(),
                        (error) => callback(error, operation)
                    );
                } else {
                    callback(null, operation);
                }
            },
            (operation, callback) => {
                this.logger.info('Removing operation ' + operation.getId() + ' of type ' + operation.getType());
                const sessionOperations = this.operations[sessionId];
                delete sessionOperations[operation.getId()];

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
        this.services.logger.info('Starting operation ' + operation.getId() + ' of type ' + operation.getType());
        const sessionOperations = this.operations[sessionId] || (this.operations[sessionId] = {});
        const operationId = operation.getId();
        sessionOperations[operationId] = operation;
        callback(null, operation);
    }

    _onOperationNotFound(callback) {
        callback(new Error('Operation is not found'));
    }
}

module.exports = OperationsService;