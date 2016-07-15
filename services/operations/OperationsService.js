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
    }

    addSearchOperation(session, method, callback) {
        const operation = new SearchOperation(session.id, method);
        this._addOperation(session, operation, callback);
    }

    addUploadOperation(method, userId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => {
                const operation = new UploadOperation(session.id, method, userId);
                this._addOperation(session, operation, callback);
            }
        ], callback);
    }

    addSystemOperation(method, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => {
                const operation = new SystemOperation(session.id, method);
                this._addOperation(session, operation, callback);
            }
        ], callback);

    }

    addKeepAliveOperation(searchOperation, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => {
                const operation = new KeepAliveOperation(session.id, searchOperation.id);
                // Keep-alive operation needs to go to the same AS instance as the search operation.
                operation.setASQueryName(searchOperation.getASQueryName());
                this._addOperation(session, operation, callback);
            }
        ], callback);
    }

    find(session, operationId, callback) {
        const {operations} = session;
        if (!operations || !operations[operationId]) {
            return this._onOperationNotFound(callback);
        }
        callback(null, operations[operationId]);
    }

    /**
     * Finds all operations of the specified type.
     * */
    findAllByClass(session, operationClass, callback) {
        const result = _.filter(session.operations,
            operation => ReflectionUtils.isSubclassOf(operation, operationClass));
        callback(null, result);
    }

    remove(session, operationId, callback) {
        async.waterfall([
            (callback) => this.find(session, operationId, callback),
            (operation, callback) => {
                this._closeOperationIfNeeded(session, operation, callback);
            },
            (operation, callback) => {
                this.logger.info('Removing ' + operation);
                delete session.operations[operationId];
                callback(null, operation);
            }
        ], callback);
    }

    _addOperation(session, operation, callback) {
        if (!session.operations) {
            session.operations = {};
        }
        this.logger.info('Starting ' + operation);
        session.operations[operation.getId()] = operation;
        callback(null, operation);
    }

    _onOperationNotFound(callback) {
        callback(new Error('Operation is not found'));
    }

    _closeOperationIfNeeded(session, operation, callback) {
        if (operation.shouldSendCloseToAppServer()) {
            this.services.applicationServer.requestCloseSession(
                session,
                operation.getId(),
                (error) => callback(error, operation)
            );
        } else {
            callback(null, operation);
        }
    }
}

module.exports = OperationsService;