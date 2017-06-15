'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const RESULT_TYPES = require('./AppServerResultTypes');
const ErrorUtils = require('../../../utils/ErrorUtils');

class AppServerSourcesService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    requestSourcesList(callback) {
        const method = METHODS.getSourcesList;
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => this.services.operations.addSystemOperation(method,
                (error, operation) => callback(error, session, operation)
            ),
            (session, operation, callback) => this._rpcSend(session, operation, method, null, null, callback)
        ], callback);
    }

    requestSourceMetadata(sourceNames, callback) {
        const method = METHODS.getSourceMetadata;
        async.waterfall([
            (callback) => this.services.sessions.findSystemSession(callback),
            (session, callback) => this.services.operations.addSystemOperation(method,
                (error, operation) => callback(error, session, operation)
            ),
            (session, operation, callback) => this._rpcSend(session, operation, method,
                _.map(sourceNames, (sourceName) => `${sourceName}.h5`), null, callback)
        ], callback);
    }

    processGetSourcesListResult(session, operation, message, callback) {
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                session,
                operation,
                EVENTS.onSourcesListReceived,
                session.id,
                operation.getId(),
                true,
                ErrorUtils.createAppServerInternalError(message),
                callback
            );
        } else {
            const sourcesList = _.map(message.result, (source) => {
                source.sourceName = source.sourceName.replace('.h5', '');
                return source;
            });

            /**
             * @type AppServerOperationResult
             * */
            const operationResult = {
                session,
                sessionId: session.id,
                userId: session.userId,
                eventName: EVENTS.onSourcesListReceived,
                operation,
                shouldCompleteOperation: true,
                resultType: RESULT_TYPES.SUCCESS,
                result: sourcesList,
                error: null
            };

            callback(null, operationResult);
        }
    }

    processGetSourceMetadataResult(session, operation, message, callback) {
        this.logger.debug('Processing get sources list result for operation ' + operation.getId());
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                session,
                operation,
                EVENTS.onSourceMetadataReceived,
                session.id,
                operation.getId(),
                true,
                ErrorUtils.createAppServerInternalError(message),
                callback
            );
        } else {
            const messageResult = message.result;
            const convertedSourcesMetadata = _.map(messageResult, sourceMetadata => {
                return {
                    fields: sourceMetadata.columns,
                    reference: sourceMetadata.reference
                };
            });

            /**
             * @type AppServerOperationResult
             * */
            const operationResult = {
                eventName: EVENTS.onSourceMetadataReceived,
                session,
                operation,
                shouldCompleteOperation: true,
                resultType: RESULT_TYPES.SUCCESS,
                result: convertedSourcesMetadata,
                error: null
            };
            callback(null, operationResult);
        }
    }
}

module.exports = AppServerSourcesService;
