'use strict';

const _ = require('lodash');

const RESULT_TYPES = require('./AppServerResultTypes'); 
const ServiceBase = require('../../ServiceBase');
const RPCProxy = require('../../../utils/RPCProxy');
const ErrorUtils = require('../../../utils/ErrorUtils');

const proxyProviderFunc = _.once(function () {
    // return new RPCProxy(...args);
    const args = Array.prototype.slice.call(arguments);
    const ProxyConstructor = Function.prototype.bind.apply(RPCProxy, [null].concat(args));
    return new ProxyConstructor();
});

class ApplicationServerServiceBase extends ServiceBase {
    constructor(services) {
        super(services);

        this._rpcSend = this._rpcSend.bind(this);
        this._rpcReply = this._rpcReply.bind(this);

        this.logger = this.services.logger;
        const host = this.services.config.applicationServer.host;
        const port = this.services.config.applicationServer.port;
        
        this.rpcProxy = proxyProviderFunc(host, port, this.logger, null, null, this._rpcReply)
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params, (error) => {
            if (error) {
                callback(error);
            } else {
                this.logger.info('RPC SEND: ' + operationId + ' ' + method);
                this.logger.info('Params: ' + JSON.stringify(params, null, 2));
                callback(null, operationId);
            }
        });
    }

    _rpcReply(rpcMessage) {
        this.logger.info('RPC REPLY: ' + JSON.stringify(rpcMessage, null, 2));
        if (!rpcMessage.id) {
            this.logger.error('Message has no id, so will be ignored.');
        } else {
            this.services.applicationServerReply.onRpcReplyReceived(rpcMessage, (error) => {
                if (error) {
                    this.logger.error('Error processing RPC reply: ' + ErrorUtils.createErrorMessage(error));
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
     * @property {OperationBase}operation
     * @property {string}eventName Event to generate.
     * @property {boolean}shouldCompleteOperation If true, corresponding operation descriptor should be destroyed.
     * @property {string}resultType 'error' || 'normal'.
     * @property {(AppServerProgressMessage|AppServerUploadResult|Array|undefined)}result Operation result data.
     * @property {(AppServerErrorResult|undefined)}error Error object in case of error occurred.
     * */

    /**
     * @param {OperationBase}operation
     * @param {string}eventName
     * @param {boolean}shouldCompleteOperation
     * @param {AppServerErrorResult}error
     * @param {function(Error, AppServerOperationResult)}callback
     */
    _createErrorOperationResult(operation, eventName, shouldCompleteOperation, error, callback) {
        /**@type AppServerOperationResult*/
        const result = {
            operation,
            eventName,
            shouldCompleteOperation,
            resultType: RESULT_TYPES.ERROR,
            error
        };
        callback(null, result);
    }
    
    _isAsErrorMessage(message) {
        return message.error;
    }
}

module.exports = ApplicationServerServiceBase;
