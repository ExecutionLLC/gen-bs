'use strict';

const Uuid = require('node-uuid');
const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

const SYSTEM_SESSION = '9c952e80-c2db-4a09-a0b0-6ea667d254a1';

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

    systemSessionId() {
        return SYSTEM_SESSION;
    }

    operationTypes() {
        return OPERATION_TYPES;
    }

    add(sessionId, operationType, method, callback) {
        const operationId = Uuid.v4();
        const sessionOperations = this.operations[sessionId] || (this.operations[sessionId] = {});
        const operation = {
            id: operationId,
            sessionId: sessionId,
            type: operationType,
            method: method,
            timestamp: Date.now()
        };
        sessionOperations[operationId] = operation;
        callback(null, operation);
    }

    findInAllSessions(operationId, callback) {
        const operation = _.map(this.operations)
            .find(operation => operation.id === operationId);
        if (operation) {
            callback(null, operation);
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
            callback(new Error('Session is not found'));
        }
    }

    findAll(sessionId, callback) {
        const sessionOperations = this.operations[sessionId];
        if (sessionOperations) {
            const operations = _.filter(sessionOperations);
            callback(null, operations);
        } else {
            callback(new Error('Session is not found'));
        }
    }

    /**
     * Finds all operations of the specified type.
     * */
    findAllByType(sessionId, operationType, callback) {
        this.findAll(sessionId, (error, operations) => {
           if (error) {
               callback(error);
           } else {
               const result = _.filter(operations, operation => operation.type === operationType);
               callback(null, result);
           }
        });
    }

    remove(sessionId, operationId, callback) {
        this.find(sessionId, operationId, (error) => {
            if (error) {
                callback(error);
            } else {
                const sessionOperations = this.operations[sessionId];
                const operation = sessionOperations[operationId];
                delete sessionOperations[operationId];
                callback(null, operation);
            }
        });
    }

    removeAll(sessionId, callback) {
        const sessionOperations = this.operations[sessionId];
        if (sessionOperations) {
            // Close AS sessions for search operations.
            const searchOperations = _.filter(sessionOperations, operation => operation.type === OPERATION_TYPES.SEARCH);

            // Delete operations.
            delete this.operations[sessionId];

            // Now we expect the only search operation, so just report error and do nothing, if there are more.
            if (searchOperations.length > 1) {
                callback(new Error('Too many search operations for the session'));
            } else {
                const searchOperation = searchOperations[0];
                this.services.applicationServer.requestCloseSearchSession(searchOperation.id, callback);
            }
        } else {
            callback(null);
        }
    }

    _onOperationNotFound(callback) {
        callback(new Error('Operation is not found'));
    }
}

module.exports = OperationsService;