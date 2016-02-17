'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');
var _ = require('lodash');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

const EVENTS = {
    onOperationResultReceived: 'onOperationResultReceived',
    onSourcesListReceived: 'onSourcesListReceived',
    onSourceMetadataReceived: 'onSourceMetadataReceived'
};

class ApplicationServerReplyService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.eventEmitter = new EventProxy(EVENTS);
    }

    registeredEvents() {
        return EVENTS;
    }

    sessionStatuses() {
        return SESSION_STATUS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }

    onRpcReplyReceived(rpcError, rpcMessage, callback) {
        if (rpcError && !rpcMessage) {
            console.error('RPC request error! %s', rpcError);
            console.log('The RPC event will be ignored, as there is no message received, only error.');
        } else {
            async.waterfall([
                (callback) => {
                    this._findMessageOperation(rpcMessage, callback);
                },
                (operation, callback) => {
                    this._processOperationResult(operation, rpcError, rpcMessage, (error, operationResult) => {
                        callback(error, {
                            operation,
                            operationResult
                        });
                    });
                },
                (resultWithOperation, callback) => {
                    // Determine if we should complete the operation, and complete it.
                    const shouldCompleteOperation = resultWithOperation.operationResult
                        && resultWithOperation.operationResult.shouldCompleteOperation;
                    this._completeOperationIfNeeded(
                        resultWithOperation.operation,
                        shouldCompleteOperation,
                        (error) => {
                            callback(error, resultWithOperation);
                        });
                }
            ], (error, resultWithOperation) => {
                if (!resultWithOperation || !resultWithOperation.operation) {
                    console.error('No operation is found. Error: ' + error);
                } else if (resultWithOperation && resultWithOperation.operationResult) {
                    // Fire only progress events here, for which operationResult != null.
                    // Redis has it's own event to indicate the data retrieval finish,
                    // and operationResult == null in this case.
                    const operation = resultWithOperation.operation;
                    const result = resultWithOperation.operationResult;
                    const eventData = {
                        operationId: operation.getId(),
                        sessionId: operation.getSessionId(),
                        result
                    };
                    this.eventEmitter.emit(EVENTS.onOperationResultReceived, eventData);
                    callback(error, result);
                } else {
                    callback(error, null);
                }
            });
        }
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * */
    _processOperationResult(operation, rpcError, rpcMessage, callback) {
        const event = operation.getMethod();
        const events = this.services.applicationServer.registeredEvents();

        let result = null;

        if (rpcError) {
            // Errors in any types of the operations except the search operations should make them completed.
            const shouldCompleteOperation = operation.getType() !== this.services.operations.operationTypes().SEARCH;
            callback(null, {
                operationId: operation.getId(),
                error: rpcError,
                result: rpcMessage,
                shouldCompleteOperation
            });
            return;
        }

        switch (event) {
            case events.openSearchSession:
                this._processOpenSearchResult(operation, rpcMessage, callback);
                break;

            case events.uploadSample:
                this._processUploadSampleResult(operation, rpcMessage, callback);
                break;

            default:
                console.error('Unexpected result came from the application server, send as is.');
                callback(null, rpcMessage.result);
                break;
        }
    }

    _processUploadSampleResult(operation, message, callback) {
        this.services.logger.info('Processing upload result for operation ' + operation.getId());
        if (!message || !message.result || !message.result.status) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message
            });
        } else {
            const result = message.result;
            const status = result.status;
            const progress = result.progress;

            // If not ready, just send the progress up
            if (status !== SESSION_STATUS.READY) {
                callback(null, {
                    status,
                    progress,
                    shouldCompleteOperation: false
                });
            } else {
                // Sample is fully processed and the fields metadata is available.
                // Now we need to:
                // 1. Insert all the data into database.
                // 2. Send a message to the frontend to indicate the processing is fully completed.
                // 3. Close the operation.
                const sampleId = operation.getSampleId();
                const fieldsMetadata = result.metadata;
                const sampleFileName = operation.getSampleFileName();
                const sessionId = operation.getSessionId();

                async.waterfall([
                    (callback) => this.services.sessions.findSessionUserId(sessionId, callback),
                    (userId, callback) => this.services.users.find(userId, callback),
                    (user, callback) => this.services.samples.createMetadataForUploadedSample(user, sampleId,
                        sampleFileName, fieldsMetadata, callback)
                ], (error) => {
                    callback(error, {
                        status,
                        progress,
                        shouldCompleteOperation: true
                    });
                });
            }
        }
    }

    /**
     * Parses RPC message for the 'open_session' method calls.
     * */
    _processOpenSearchResult(operation, message, callback) {
        if (!message || !message.result || !message.result.sessionState) {
            console.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message
            });
        } else {
            const sessionState = message.result.sessionState;

            const sampleId = operation.getSampleId();
            const userId = operation.getUserId();
            const limit = operation.getLimit();
            const offset = operation.getOffset();

            // If not ready, just send the progress up
            if (sessionState.status !== SESSION_STATUS.READY) {
                callback(null, {
                    status: sessionState.status,
                    progress: sessionState.progress,
                    shouldCompleteOperation: false
                });
            } else {
                // Get data from Redis
                const redisInfo = sessionState.redisDb;
                const redisParams = {
                    host: redisInfo.host,
                    port: redisInfo.port,
                    sampleId,
                    userId,
                    operationId: operation.getId(),
                    sessionId: operation.getSessionId(),
                    databaseNumber: redisInfo.number,
                    dataIndex: redisInfo.resultIndex,
                    offset,
                    limit
                };
                async.waterfall([
                    (callback) => {
                        this._storeRedisParamsInOperation(redisParams, operation, callback);
                    },
                    (callback) => {
                        this.services.redis.fetch(redisParams, callback);
                    }
                ], (error) => {
                    // Redis will fire data event by itself, so send null as result to distinguish cases.
                    callback(error, null);
                });
            }
        }
    }

    _storeRedisParamsInOperation(redisParams, operation, callback) {
        // Store Redis information in the operation.
        // This is done to be able to fetch another page later.
        const params = {
            host: redisParams.host,
            port: redisParams.port,
            databaseNumber: redisParams.databaseNumber,
            dataIndex: redisParams.dataIndex,
            sampleId: redisParams.sampleId
        };

        operation.setRedisParams(params);
        callback(null);
    }

    _findMessageOperation(rpcMessage, callback) {
        const operationId = rpcMessage.id;
        this.services.operations.findInAllSessions(operationId, callback);
    }

    /**
     * Deletes associated information for completed operations.
     * */
    _completeOperationIfNeeded(operation, shouldComplete, callback) {
        const operations = this.services.operations;
        if (shouldComplete) {
            operations.remove(operation.sessionId, operation.getId(), callback);
        } else {
            callback(null, operation);
        }
    }
}

module.exports = ApplicationServerReplyService;