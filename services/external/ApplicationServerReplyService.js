'use strict';

const async = require('async');

const ServiceBase = require('../ServiceBase');
const EventProxy = require('../../utils/EventProxy');
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
            this.logger.error('RPC request error! %s', rpcError);
            this.logger.info('The RPC event will be ignored, as there is no message received, only error.');
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
                    this.logger.error('No operation is found. Error: ' + error);
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
                    this.eventEmitter.emit(result.eventName, eventData);
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
                eventName: EVENTS.onOperationResultReceived,
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

            case events.getSourcesList:
                this._processGetSourcesListResult(operation, rpcMessage, callback);
                break;

            case events.getSourceMetadata:
                this._processGetSourceMetadataResult(operation, rpcMessage, callback);
                break;

            default:
                this.logger.error('Unexpected result came from the application server, send as is.');
                callback(null, rpcMessage.result);
                break;
        }
    }

    _processGetSourcesListResult(operation, message, callback) {
        this.logger.info('Processing get sources list result for operation ' + operation.getId());
        if (!message || !message.result) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                eventName: EVENTS.onSourcesListReceived,
                result: message
            });
        } else {
            const sourcesList = _.map(message.result, (source) => {
                source.sourceName = source.sourceName.replace('.h5', '');
                return source;
            });
            callback(null, {
                eventName: EVENTS.onSourcesListReceived,
                sourcesList
            });
        }
    }

    _processGetSourceMetadataResult(operation, message, callback) {
        this.logger.info('Processing get sources list result for operation ' + operation.getId());
        if (!message || !message.result) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                eventName: EVENTS.onSourceMetadataReceived
            });
        } else {
            const messageResult = message.result;
            if (messageResult.error) {
                callback(null, {
                    eventName: EVENTS.onSourceMetadataReceived,
                    error: messageResult.error
                });
            } else {
                const convertedSourcesMetadata = _.map(messageResult, sourceMetadata => {
                    return {
                        fieldsMetadata: sourceMetadata.columns,
                        reference: sourceMetadata.reference
                    };
                });
                callback(null, {
                    eventName: EVENTS.onSourceMetadataReceived,
                    sourcesMetadata: convertedSourcesMetadata
                });
            }
        }
    }

    _processUploadSampleResult(operation, message, callback) {
        this.logger.info('Processing upload result for operation ' + operation.getId());
        if (!message || !message.result || !message.result.status) {
            this.services.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                eventName: EVENTS.onOperationResultReceived,
                shouldCompleteOperation: true
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
                    eventName: EVENTS.onOperationResultReceived,
                    shouldCompleteOperation: false
                });
            } else {
                // Sample is fully processed and the fields metadata is available.
                // Now we need to:
                // 1. Insert all the data into database.
                // 2. Send a message to the frontend to indicate the processing is fully completed.
                // 3. Close the operation.
                const sampleId = operation.getSampleId();
                const sampleMetadata = result.metadata;
                const fieldsMetadata = sampleMetadata.columns;
                const sampleReference = sampleMetadata.reference;
                const sampleFileName = operation.getSampleFileName();
                const sessionId = operation.getSessionId();

                async.waterfall([
                    (callback) => this.services.sessions.findSessionUserId(sessionId, callback),
                    (userId, callback) => this.services.users.find(userId, callback),
                    (user, callback) => this.services.samples.createMetadataForUploadedSample(user, sampleId,
                        sampleFileName, sampleReference, fieldsMetadata, callback)
                ], (error, sampleVersionId) => {
                    callback(error, {
                        status,
                        progress,
                        sampleId: sampleVersionId,
                        eventName: EVENTS.onOperationResultReceived,
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
            this.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                shouldCompleteOperation: false,
                eventName: EVENTS.onOperationResultReceived
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
                    shouldCompleteOperation: false,
                    eventName: EVENTS.onOperationResultReceived
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