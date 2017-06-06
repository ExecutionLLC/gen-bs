'use strict';

const _ = require('lodash');

const RESULT_TYPES = require('./AppServerResultTypes');
const ServiceBase = require('../../ServiceBase');
const RPCProxy = require('../../../utils/RPCProxy');
const ErrorUtils = require('../../../utils/ErrorUtils');
const ChangeCaseUtil = require('../../../utils/ChangeCaseUtil');
const AppServerNotRespondedError = require('../../../utils/errors/AppServerNotRespondedError');

const proxyProviderFunc = _.once(function (...args) {
    return new RPCProxy(...args);
});

class ApplicationServerServiceBase extends ServiceBase {
    constructor(services) {
        super(services);

        _.bindAll(this, ['_rpcSend', '_rpcReply', '_rpcReturned']);
        const {
            rabbitMq: {
                host, port, user, virtualHost, password, reconnectTimeout, requestExchangeName
            },
            serverId
        } = this.services.config;
        const wsQueueName = `ws_private_${serverId}`;
        /**
         * @type RpcProxyParams
         * */
        const proxyParams = {
            host,
            port,
            user,
            password,
            virtualHost,
            logger: this.logger,
            reconnectTimeout,
            requestExchangeName,
            replyCallback: this._rpcReply,
            returnCallback: this._rpcReturned,
            wsQueueName
        };
        /**
         * @type {RPCProxy}
         * */
        this.rpcProxy = proxyProviderFunc(proxyParams);
    }

    _rpcReturned(rpcMessage) {
        const {id, replyTo, method} = ChangeCaseUtil.convertKeysToCamelCase(rpcMessage);
        this._rpcReply({
            id,
            method,
            error: new AppServerNotRespondedError()
        });
    }

    createAppServerSessionId(operation) {
        return `${operation.getSessionId()}_${operation.getId()}`;
    }

    /**
     * @param {Object}session
     * @param {OperationBase}operation
     * @param {string}method
     * @param {Object}params
     * @param {(number|null)}priority
     * @param {function(Error, string=)}callback
     * */
    _rpcSend(session, operation, method, params, priority, callback) {
        const operationId = operation.getId();
        const queryNameOrNull = operation.getASQueryName();
        const messageId = this.createAppServerSessionId(operation);
        this._rpcProxySend(messageId, operationId, method, params, queryNameOrNull, priority, callback);
    }

    _rpcProxySend(messageId, operationId, method, params, queryNameOrNull, priority, callback) {
        this.rpcProxy.send(messageId, method, params, queryNameOrNull, priority, (error) => {
            if (error) {
                callback(error);
            } else {
                this.logger.info(`RPC SEND: \n\tmessageId: ${messageId}\n\tMethod: ${method}`);
                this.logger.info(`Params:\n ${JSON.stringify(params, null, 2)}`);
                callback(null, operationId);
            }
        });
    }

    _rpcReply(rpcMessage) {
        this.logger.info(`RPC REPLY:\n\t${JSON.stringify(rpcMessage, null, 2)}`);
        const parts = (rpcMessage.id || '').split('_');
        if (parts.length !== 2) {
            this.logger.error(`Message id is of an incorrect format, message will be ignored. Id: ${rpcMessage.id}`);
        } else {
            const sessionId = parts[0];
            const operationId = parts[1];
            this.services.applicationServerReply.onRpcReplyReceived(sessionId, operationId, rpcMessage, (error) => {
                if (error) {
                    this.logger.error(`Error processing RPC reply: ${ErrorUtils.createErrorMessage(error)}`);
                }
            });
        }
    }

    /**
     * @typedef {Object}AppServerErrorResult
     * @property {number}code
     * @property {string}message
     * */

    /**
     * @typedef {Object}AppServerProgressMessage
     * @property {string}status
     * @property {number}progress
     * */

    /**
     * @typedef {AppServerProgressMessage}AppServerUploadResult
     * @property {string}sampleId
     * */

    /**
     * @typedef {AppServerProgressMessage}AppServerSearchResult
     * @property {Array<Object>}data
     * */

    /**
     * @typedef {Object}AppServerOperationResult
     * @property {string}[targetSessionId] If specified, it will be used to match client web socket.
     * @property {string}targetUserId If targetSessionId is undefined, result will be sent to all sessions of the specified user.
     * @property {ExpressSession}session
     * @property {OperationBase}operation
     * @property {string}eventName Event to generate.
     * @property {boolean}shouldCompleteOperation If true, corresponding operation descriptor should be destroyed.
     * @property {string}resultType 'error' || 'normal'.
     * @property {(AppServerProgressMessage|AppServerUploadResult|Array|undefined)}result Operation result data.
     * @property {(AppServerErrorResult|undefined)}error Error object in case of error occurred.
     * */

    /**
     * @param {ExpressSession}session
     * @param {OperationBase}operation
     * @param {string}eventName
     * @param {string}targetSessionId
     * @param {string}targetOperationId
     * @param {boolean}shouldCompleteOperation
     * @param {AppServerErrorResult}error
     * @param {function(Error, AppServerOperationResult)}callback
     */
    _createErrorOperationResult(session, operation, eventName, targetSessionId,
                                targetOperationId, shouldCompleteOperation, error, callback) {
        /**@type AppServerOperationResult*/
        const result = {
            session,
            operation,
            eventName,
            targetSessionId,
            targetOperationId,
            shouldCompleteOperation,
            resultType: RESULT_TYPES.ERROR,
            error
        };
        callback(null, result);
    }

    /**
     * @param {(string|null)}targetSessionId If specified, it will be used to match client web socket.
     * @param {string}targetUserId If targetSessionId is undefined, result will be sent to all sessions of the specified user.
     * @param {ExpressSession}session
     * @param {OperationBase}operation
     * @param {string}eventName Event to generate.
     * @param {boolean}shouldCompleteOperation If true, corresponding operation descriptor should be destroyed.
     * @param {(AppServerProgressMessage|AppServerUploadResult|Array|undefined)}result Operation result data.
     * @param {(AppServerErrorResult|null)}error
     * @param {function(Error, AppServerOperationResult)}callback
     */
    _createOperationResult(session, operation, targetSessionId, targetUserId,
                           eventName, shouldCompleteOperation, result, error, callback) {
        /**@type AppServerOperationResult*/
        const operationResult = {
            session,
            operation,
            targetSessionId,
            targetUserId,
            eventName,
            shouldCompleteOperation,
            resultType: error ? RESULT_TYPES.ERROR : RESULT_TYPES.SUCCESS,
            error,
            result
        };
        callback(null, operationResult);
    }

    _isAsErrorMessage(message) {
        return !!message.error;
    }
}

module.exports = ApplicationServerServiceBase;
