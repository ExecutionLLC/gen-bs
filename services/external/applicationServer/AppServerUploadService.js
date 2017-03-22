'use strict';

const fs = require('fs');
const async = require('async');
const _ = require('lodash');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const ErrorUtils = require('../../../utils/ErrorUtils');

const METHODS = require('./AppServerMethods');
const {
    SAMPLE_UPLOAD_STATUS,
    WS_SAMPLE_UPLOAD_STATE
} = require('../../../utils/Enums');
const EVENTS = require('./AppServerEvents');
const SESSION_STATUS = {
    CONVERTING: 'converting',
    UPLOADING: 'uploading',
    READY: 'ready'
};
const UploadOperation = require('../../operations/UploadOperation');


/**
 * Make queue for asynchronous functions.
 * Execute the callbacks in the same order as the asynchronous functions executed.
 * Example:
 * const q = makeAsyncQueue(); // global queue
 * // Function that sometimes callback will be called back quickly,
 * // and sometimes later. We want to receive callbacks in the same order as
 * // 'someAsyncFunction' called.
 * function someAsyncFunction() {
 *   const done = q(); // 'done' must be called before callback.
 *   doStuff(..., (result) => { // this function can be called in any order depending on the 'doStuff' functionality
 *     done(() => { // this function will be called in the same order as 'someAsyncFunction'
 *       callback(result); // calling back
 *     });
 *   });
 * }
 * @returns {function()}
 */
function makeAsyncQueue() {
    /**
     * Pairs of [id, function()]
     * When call id is called back then we must execute the function
     * or set the function for further execution in desired order.
     * @type {Array.<[*, function()]>}
     */
    const callsQueue = [];

    /**
     * Set callback for call id is ready, this call is called back.
     * @param {*} callId
     * @param {function()} callback
     */
    function setReady(callId, callback) {
        /**
         * this identifier must be there
         * @type {number}
         */
        const queueIndex = callsQueue.findIndex(qr => callId === qr[0]);
        callsQueue[queueIndex][1] = callback;
    }

    /**
     * Check queue for executed callbacks and execute it in the order.
     * Execute all consequent present callbacks, break when no next callback found.
     */
    function checkReady() {
        while (callsQueue.length) {
            const callback = callsQueue[0][1];
            if (!callback) {
                break;
            }
            callsQueue.shift();
            callback();
        }
    }

    /**
     * Return the function that stores incoming call to the queue
     * and returns the function that must be called before callback execution.
     */
    return () => {
        const callIdentifier = {}; // we will compare by '===' so the empty object is appropriate here as unique identifier
        callsQueue.push([callIdentifier, null]); // no function before callback is executed

        function queueDone(callback) {
            setReady(callIdentifier, callback);
            checkReady();
        }

        return queueDone;
    };
}

function callbackErrorHandler(fn, callback) {
    try {
        fn()
    } catch (err) {
        callback(err);
    }
}

class AppServerUploadService extends ApplicationServerServiceBase {
    constructor(services, models) {
        super(services, models);
        this._uploadProgressAsyncQueue = makeAsyncQueue();
    }

    uploadSample(user, fileId, sampleFileName, callback) {
        async.waterfall([
            (callback) => this.services.operations.addUploadOperation(METHODS.uploadSample, fileId, callback),
            (operation, callback) => {
                operation.setSampleFileName(sampleFileName);
                operation.setUserId(user.id);
                callback(null, operation.getId());
            }
        ], callback);
    }

    toggleNextOperation(currentOperationId, callback) {
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => {
                const uploadOperations = this.getUploadOperations(systemSession);
                const currentOperation = _.find(uploadOperations, operation => {
                            return operation.getId() === currentOperationId;
                        }
                    ) || null;
                const currentUserId = !_.isNull(currentOperation) ? currentOperation.getUserId() : null;
                const activeOperationUsersIds = _.filter(uploadOperations, operation => {
                    return operation.isActive && operation.getUserId() !== currentUserId;
                }).map(operation => operation.getUserId());
                const orderedOperations = _.orderBy(uploadOperations, ['timestamp'], ['asc']);
                const nextOperation = _.find(orderedOperations, operation => {
                    return !_.includes(activeOperationUsersIds, operation.getUserId()) && !operation.isActive;
                });
                if (nextOperation) {
                    nextOperation.isActive = true;
                    async.waterfall([
                        (callback) => this.services.sessions.findById(nextOperation.getSessionId(), callback),
                        (session, callback) => this.requestSampleProcessing(
                            session, nextOperation.getId(), null, (error) => callback(error)
                        )
                    ], callback)
                } else {
                    callback(null);
                }
            }
        ], callback);
    }

    requestSampleProcessing(session, operationId, priority, callback) {
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => this.services.operations.find(systemSession, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                const {newSamplesBucket} = this.services.objectStorage.getStorageSettings();
                const params = {
                    sample: operationId,
                    bucket: newSamplesBucket
                };
                this._rpcSend(session, operation, method, params, priority, callback);
            }
        ], callback);
    }

    requestUploadProcessing(session, operationId, priority, callback) {
        const {userId} = session;
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSession(callback),
            (systemSession, callback) => {
                const uploadOperations = this.getUploadOperations(systemSession);
                const currentOperation = _.find(uploadOperations, operation => {
                        return operation.getId() === operationId;
                    }
                );
                const userOperations = _.filter(uploadOperations, operation => {
                    return operation.getUserId() == userId;
                });
                const activeUserOperation = _.filter(userOperations, operation => {
                    return operation.isActive;
                });
                if (activeUserOperation.length === 0) {
                    currentOperation.isActive = true;
                    this.requestSampleProcessing(session, operationId, priority, callback);
                } else {
                    callback(null, operationId);
                }
            }
        ], callback);
    }

    processUploadResult(session, operation, message, callback) {
        const queueDone = this._uploadProgressAsyncQueue();
        this.logger.debug('Processing upload result for ' + operation);
        const result = message.result;
        /**@type {string}*/
        const status = (result || {}).status;
        async.waterfall([
            (callback) => this.services.users.find(operation.getUserId(), callback),
            (user, callback) => {

                const doStuff = (callback) => {
                    if (this._isAsErrorMessage(message)) {
                        this._handleUploadError(user, session, operation, message, callback);
                    } else if (status !== SESSION_STATUS.READY) {
                        this._handleUploadProgress(user, session, operation, message, callback);
                    } else {
                        this._completeUpload(user, session, operation, message, callback);
                    }
                };

                doStuff((err, res) => {
                    queueDone(() => {
                        callback(err, res);
                    });
                });
            }
        ], callback);
    }

    _handleUploadError(user, session, operation, message, callback) {
        const error = ErrorUtils.createAppServerInternalError(message);
        this._handleError(user, operation, error, session, callback)
    }

    _handleError(user, operation, error, session, callback) {
        async.waterfall([
            (callback) => {
                callbackErrorHandler(() => {
                    this.services.sampleUploadHistory.update(user, {
                        id: operation.getId(),
                        status: SAMPLE_UPLOAD_STATUS.ERROR,
                        error
                    }, (error) => callback(error));
                }, callback);
            },
            (callback) => {
                callbackErrorHandler(() => {
                    const {newSamplesBucket} = this.services.objectStorage.getStorageSettings();
                    const vcfFileId = operation.getId();
                    this.services.objectStorage.deleteObject(newSamplesBucket, vcfFileId,
                        (error, result) => callback(error));
                }, callback);
            },
            (callback) => {
                callbackErrorHandler(() => {
                    this.services.samples.theModel.findSamplesByVcfFileIds(user.id, [operation.getId()], true,
                        (error, existingSamples) => callback(error, existingSamples));
                }, callback);
            },
            (existingSamples, callback) => {
                callbackErrorHandler(() => {
                    const sampleUploadStates = _.map(existingSamples, (sample) => {
                        return Object.assign({}, sample, {
                            uploadState: WS_SAMPLE_UPLOAD_STATE.ERROR,
                            error
                        });
                    });
                    async.map(sampleUploadStates, (sample, callback) => {
                        return this.services.samples.update(user, sample, callback);
                    }, (error, result) => callback(error, result));
                }, callback);
            }
        ], () => {
            async.waterfall([
                (callback) => this.toggleNextOperation(operation.getId(), callback),
                (callback) => this.services.samples.theModel.findSamplesByVcfFileIds(user.id, [operation.getId()], true,
                    (error, existingSamples) => callback(error, existingSamples)),
                (existingSamples, callback) => this._createOperationResult(
                    session,
                    operation,
                    null,
                    operation.getUserId(),
                    EVENTS.onOperationResultReceived,
                    true,
                    {
                        status: SAMPLE_UPLOAD_STATUS.ERROR,
                        progress: 0,
                        metadata: existingSamples
                    },
                    error,
                    callback
                )
            ], callback);
        });
    }

    _handleUploadProgress(user, session, operation, message, callback) {
        const {result: {progress}} = message;
        async.waterfall([
            (callback) => this.services.sampleUploadHistory.update(user, {
                id: operation.getId(),
                status: SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
                progress,
                error: null
            }, (error) => callback(error)),
            (callback) => this._createUploadProgressResult(user, session, operation, message, callback),
            (result, callback) => super._createOperationResult(
                session, operation, null, operation.getUserId(), EVENTS.onOperationResultReceived, false, result, null, callback
            )
        ], callback);
    }

    _createUploadProgressResult(user, session, operation, message, callback) {
        const {result: {status, progress, genotypes}} = message;
        if (genotypes) {
            const sampleGenotypes = _.isEmpty(genotypes) ? [null] : genotypes;
            const vcfFileId = operation.getId();
            const vcfFileName = operation.getSampleFileName();
            async.waterfall([
                (callback) => this.services.samples.updateSamplesForVcfFile(
                    user, vcfFileId, vcfFileName, sampleGenotypes, callback
                ),
                (samples, callback) => {
                    callback(null, {
                        status,
                        progress,
                        metadata: samples
                    });
                }
            ], callback);
        } else {
            callback(null, {
                status,
                progress
            });
        }
    }

    _completeUpload(user, session, operation, message, callback) {
        // Sample is fully processed and the fields metadata is available.
        // Now we need to:
        // 1. Insert all the data into database.
        // 2. Close the operation.
        // 3. Mark upload as completed in the database.
        const result = message.result;
        /**@type {string}*/
        const vcfFileId = operation.getId();
        const sampleMetadata = result.metadata;
        // Usual fields metadata. Values of these fields are the same for all genotypes.
        const commonFieldsMetadata = sampleMetadata.columns;

        async.waterfall([
            (callback) => {
                callbackErrorHandler(() => {
                    this.services.samples.createMetadataForUploadedSample(user, vcfFileId, commonFieldsMetadata,
                        (error, sampleVersionIds) => callback(error, sampleVersionIds));
                }, callback);
            },
            (sampleIds, callback) => {
                callbackErrorHandler(() => {
                    this.services.samples.findMany(user, sampleIds, callback);
                }, callback);
            },
            (samplesMetadata, callback) => {
                callbackErrorHandler(() => {
                    this.services.sampleUploadHistory.update(user, {
                        id: operation.getId(),
                        status: SAMPLE_UPLOAD_STATUS.READY,
                        progress: 100,
                        error: null
                    }, (error) => callback(error, samplesMetadata));
                }, callback);
            }
        ], (error, samplesMetadata) => {
            if (error) {
                this.logger.error(`Error inserting new sample into database: ${error}`);
                const serverError = ErrorUtils.createInternalError(error.message);
                this._handleError(user, operation, serverError, session, callback);
            } else {
                // The upload operation is already completed on the app server.
                operation.setSendCloseToAppServer(false);
                async.waterfall([
                    (callback) => this.toggleNextOperation(operation.getId(), callback),
                    (callback) => this._createOperationResult(session,
                        operation,
                        null,
                        operation.getUserId(),
                        EVENTS.onOperationResultReceived,
                        true,
                        {
                            status: SESSION_STATUS.READY,
                            progress: 100,
                            metadata: samplesMetadata
                        },
                        null,
                        callback
                    )
                ], callback);
            }
        });
    }

    getUploadOperations(session) {
        return _.filter(session.operations, operation => operation instanceof UploadOperation);
    }
}

module.exports = AppServerUploadService;
