'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('./ServiceBase');
const {
    SearchOperation,
    KeepAliveOperation,
    SystemOperation,
    UploadOperation
} = require('./operations/Operations');
const ReflectionUtils = require('../utils/ReflectionUtils');
const OperationNotFoundError = require('../utils/errors/OperationNotFoundError');

const OPERATION_CLASSES = [SearchOperation, UploadOperation, SystemOperation, KeepAliveOperation];
function getAllFuncs(obj) {
    let props = [];

    do {
        const l = Object.getOwnPropertyNames(obj)
            .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
            .sort()
            .filter((p, i, arr) =>
                typeof obj[p] === 'function' &&  //only the methods
                p !== 'constructor' &&           //not the constructor
                (i == 0 || p !== arr[i - 1]) &&  //not overriding in this prototype
                props.indexOf(p) === -1          //not overridden in a child
            );
        props = props.concat(l)
    }
    while (
    (obj = Object.getPrototypeOf(obj)) &&   //walk-up the prototype chain
    Object.getPrototypeOf(obj)              //not the the Object prototype methods (hasOwnProperty, etc...)
        );

    return props
}

class OperationsService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    addSearchOperation(session, method, callback) {
        console.log(session.id);
        const operation = new SearchOperation(session.id, method);
        console.log(operation);
        console.log(getAllFuncs(operation));
        this._addOperation(session, operation, callback);
    }

    addUploadOperation(method, operationId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => {
                const operation = new UploadOperation(session.id, method, operationId);
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

    addKeepAliveOperation(session, searchOperation, callback) {
        const operation = new KeepAliveOperation(session.id, searchOperation.id);
        // Keep-alive operation needs to go to the same AS instance as the search operation.
        operation.ASQueryName = searchOperation.ASQueryName;
        this._addOperation(session, operation, callback);
    }
    
    keepOperationsAlive(session, callback) {
        async.waterfall([
            (callback) => this.findAllByClass(session, SearchOperation, callback),
            (searchOperations, callback) => {
                async.each(
                    searchOperations,
                    (searchOperation, callback) => this.services.applicationServer.requestKeepOperationAlive(
                        session,
                        searchOperation,
                        callback
                    ), callback);
            }
        ], callback);
    }

    closeSearchOperationsIfAny(session, callback) {
        async.waterfall([
            (callback) => this.findAllByClass(session, SearchOperation, callback),
            (searchOperations, callback) => async.each(
                searchOperations,
                (operation, callback) => this._closeOperationIfNeeded(session, operation, callback),
                callback
            )
        ], callback);
    }

    find(session, operationId, callback) {
        const {operations} = session;
        if (!operations || !operations[operationId]) {
            this._onOperationNotFound(callback);
        } else {


            const operation = operations[operationId];

            console.log(operation);
            console.log(getAllFuncs(operation));
            callback(null, operation);
        }
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

    stringifyOperations(operations) {
        const operationStringsArray = _.map(operations, operation => ReflectionUtils.serialize(operation));
        return JSON.stringify(operationStringsArray);
    }

    parseOperations(operationsString) {
        const operationStringsArray = JSON.parse(operationsString);
        return _(operationStringsArray)
            .map(operationString => ReflectionUtils.deserialize(operationString, OPERATION_CLASSES))
            .reduce((result, operation) => {
                result[operation.getId()] = operation;
                return result;
            }, {});
    }

    _findInActiveUploads(operationId, callback) {
        async.waterfall([
            (callback) => this.services.sampleUploadHistory.findActiveForAllUsers(operationId, callback),
            (historyEntry, systemSession, callback) => {
                const {id, userId, sampleId, fileName} = historyEntry;
                const operation = UploadOperation.recreate(id, systemSession.id, userId, sampleId, fileName);
                callback(null, operation);
            }
        ], (error, operation) => {
            if (error) {
                this._onOperationNotFound(callback);
            } else {
                callback(null, operation);
            }
        });
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
        callback(new OperationNotFoundError('Operation is not found'));
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