'use strict';

const Uuid = require('node-uuid');
const _ = require('lodash');

const ServiceBase = require('./ServiceBase');
var async = require('async');

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

    add(sessionId, operationType, method, data, callback) {
        const operationId = Uuid.v4();
        const sessionOperations = this.operations[sessionId] || (this.operations[sessionId] = {});
        const operation = {
            id: operationId,
            sessionId: sessionId,
            type: operationType,
            method: method,
            data: data,
            timestamp: Date.now()
        };
        console.log('starting operation ' + operation.id + ' of type ' + operation.type);
        sessionOperations[operationId] = operation;
        callback(null, operation);
    }

    setData(sessionId, operationId, data, callback) {
        async.waterfall([
            (callback) => {
                this.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                operation.data = data;
                callback(null, operation);
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
        async.waterfall([
            (callback) => this.find(sessionId, operationId, callback),
            (operation, callback) => {
                const sessionOperations = this.operations[sessionId];
                delete sessionOperations[operation.id];
                if (operation.type === OPERATION_TYPES.SEARCH) {
                    this.services.applicationServer.requestCloseSearchSession(operation.sessionId, operation.id, callback);
                } else {
                    callback(null, operation);
                }
            },
            (operation, callback) => {
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
            async.each(sessionOperations, (operation, cb) => this.remove(sessionId, operation.id, cb), callback);
        } else {
            callback(null);
        }
    }

    _onOperationNotFound(callback) {
        callback(new Error('Operation is not found'));
    }
}

module.exports = OperationsService;