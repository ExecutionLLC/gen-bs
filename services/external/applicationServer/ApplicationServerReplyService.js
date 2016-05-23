'use strict';

const async = require('async');
const _ = require('lodash');

const ServiceBase = require('../../ServiceBase');
const EventProxy = require('../../../utils/EventProxy');
const METHODS = require('./AppServerMethods');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

const EVENTS = {
    onKeepAliveResultReceived: 'onKeepAliveResultReceived',
    onOperationResultReceived: 'onOperationResultReceived',
    onSourcesListReceived: 'onSourcesListReceived',
    onSourceMetadataReceived: 'onSourceMetadataReceived'
};

/**
 * @typedef {Object} AppServerResult
 * @property {string}operationId
 * @property {boolean}isOperationCompleted
 * @property {string}operationType
 * @property {string}eventName
 * @property {Object}result
 * @property {string}resultType 'error' or 'success'
 * @property {Object}error
 * */

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

    _ensureMessageIsSuccessful(message, callback) {
        if (!message.id) {
            callback(new Error('Operation id is not defined.'));
        } else if (!message.error) {
            callback(null);
        } else {
            callback(message.error);
        }
    }

    /**
     * Here RPC results are distributed by the actual handlers.
     * Errors should also be handled on this level.
     * @param rpcMessage Message to process.
     * @param callback
     */
    onRpcReplyReceived(rpcMessage, callback) {
        async.waterfall([
            (callback) => this._ensureMessageIsSuccessful(rpcMessage, callback),
            (callback) => {
                this.services.operations.findInAllSessions(rpcMessage.id, callback);
            },
            (operation, callback) => {
                this._processOperationResult(operation, rpcMessage, (error, operationResult) => {
                    callback(error, operation, operationResult);
                });
            },
            (operation, operationResult, callback) => this._findSessionIdsForOperation(
                operation,
                (error, sessionIds) => callback(error, operation, operationResult, sessionIds)
            ),
            (operation, operationResult, sessionIds, callback) => {
                // Determine if we should complete the operation, and complete it.
                const shouldCompleteOperation = operationResult && operationResult.shouldCompleteOperation;
                this._completeOperationIfNeeded(
                    operation,
                    shouldCompleteOperation,
                    (error) => callback(error, operation, operationResult, sessionIds)
                );
            }
        ], (error, operation, operationResult, sessionIds) => {
            this._createOperationResult(error, operation, operationResult, sessionIds, callback);
        });
    }

    _createOperationResult(error, operation, operationResult, sessionIds, callback) {
        if (!operation) {
            this.logger.error('No operation is found. Error: ' + error);
            return;
        }

        if (operationResult) {
            // Fire only progress events here, for which operationResult != null.
            // Redis has it's own event to indicate the data retrieval finish,
            // and operationResult == null in this case.
            const eventData = {
                operationId: operation.getId(),
                sessionIds,
                result: operationResult
            };
            this.eventEmitter.emit(operationResult.eventName, eventData);
            callback(error, operationResult);
        } else {
            callback(error, null);
        }
    }

    /**
     * Selects and runs proper message parser. Handles RPC-level errors.
     * @param {OperationBase}operation
     * @param rpcMessage
     * @param {function(Error, AppServerResult)}callback
     * @private
     */
    _processOperationResult(operation, rpcMessage, callback) {
        const method = operation.getMethod();
        const rpcError = rpcMessage.error;

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

        switch (method) {
            case METHODS.openSearchSession:
                this._processSearchResult(operation, rpcMessage, callback);
                break;

            case METHODS.uploadSample:
                this._processUploadResult(operation, rpcMessage, callback);
                break;

            case METHODS.getSourcesList:
                this._processGetSourcesListResult(operation, rpcMessage, callback);
                break;

            case METHODS.keepAlive:
                this._processKeepAliveResult(operation, rpcMessage, callback);
                break;

            case METHODS.getSourceMetadata:
                this._processGetSourceMetadataResult(operation, rpcMessage, callback);
                break;

            default:
                this.logger.error('Unexpected result came from the application server, send as is.');
                callback(null, rpcMessage.result);
                break;
        }
    }

    _findSessionIdsForOperation(operation, callback) {
        const operationTypes = this.services.operations.operationTypes();
        if (operation.getType() !== operationTypes.UPLOAD) {
            callback(null, [operation.getSessionId()]);
        } else {
            // Upload operations belong to the system session and contain user id.
            // Here we need to find all active sessions for the specified user.
            const userId = operation.getUserId();
            this.services.sessions.findAllByUserId(userId, callback);
        }
    }

    _processKeepAliveResult(operation, rpcMessage, callback) {
        const operationIdToCheck = operation.getOperationIdToCheck();
        const result = rpcMessage.result;
        if (result && result.error) {
            this.logger.error('Unexpected error received from AS as keep-alive result: ' + JSON.stringify(result.error));
            callback(null, {
                eventName: EVENTS.onKeepAliveResultReceived,
                shouldCompleteOperation: true
            });
            return;
        }

        const isAlive = result;
        if (!isAlive) {
            async.waterfall([
                // The keep-alive operation belongs to system session.
                // So we need to find the operation id in all sessions.
                (callback) => this.services.operations.findInAllSessions(operationIdToCheck, callback),
                (operation, callback) => this.services.operations.remove(operation.getSessionId(), operation.getId(), callback)
            ], (error) => {
                if (error) {
                    this.logger.error('Error while closing dead search operation: ' + error);
                }

                callback(null, {
                    eventName: EVENTS.onKeepAliveResultReceived,
                    shouldCompleteOperation: true
                });
            });
        } else {
            callback(null, {
                eventName: EVENTS.onKeepAliveResultReceived,
                shouldCompleteOperation: true
            });
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

    _processUploadResult(operation, message, callback) {
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
                const message = {
                    status,
                    progress,
                    shouldCompleteOperation: false,
                    eventName: EVENTS.onOperationResultReceived
                };
                operation.setLastAppServerMessage(message);
                callback(null, message);
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
                const userId = operation.getUserId();

                async.waterfall([
                    (callback) => this.services.users.find(userId, callback),
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
    _processSearchResult(operation, message, callback) {
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