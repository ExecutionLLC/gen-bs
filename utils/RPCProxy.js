'use strict';

const _ = require('lodash');
const async = require('async');

const RabbitMqUtils = require('./RabbitMqUtils');
const ChangeCaseUtil = require('./ChangeCaseUtil');

class RPCProxy {
    /**
     * @param {string}host RabbitMQ host.
     * @param {string}requestQueueName Name of the task queue.
     * @param {number}reconnectTimeout Timeout in milliseconds
     * @param {object}logger
     * @param {function()}connectCallback
     * @param {function()}disconnectCallback
     * @param {function(object)}replyCallback
     */
    constructor(host, requestQueueName, reconnectTimeout, logger, connectCallback, disconnectCallback, replyCallback) {
        Object.assign(this, {host, requestQueueName, reconnectTimeout,
            logger, connectCallback, disconnectCallback, replyCallback}, {
                connected: false
            });
        _.bindAll(this, ['_address', '_replyResult', '_error', '_close', '_connect', 'send']);
        // Try to reconnect automatically if connection is closed
        this._connect();
        setInterval(this._connect, reconnectTimeout);
    }

    isConnected() {
        return this.connected;
    }

    send(operationId, method, params, queryNameOrNull, callback) {
        const context = this.rabbitContext;
        if (!context) {
            callback(new Error('Connection to application server is lost.'));
        } else {
            const {requestQueue, replyQueue} = this.rabbitContext;
            const fullParams = Object.assign({}, params, {
                replyTo: replyQueue
            });
            const convertedParams = ChangeCaseUtil.convertKeysToSnakeCase(fullParams);
            const message = this._constructMessage(operationId, method, convertedParams);
            // Can send requests either to a particular AS instance, or to the tasks queue.
            const actualQueueName = queryNameOrNull || requestQueue;
            RabbitMqUtils.sendJson(this.rabbitContext, actualQueueName, message, callback);
        }
    }

    _constructMessage(operationId, method, params) {
        return {id: operationId, method: method, params: params};
    }

    _replyResult(messageString) {
        const unconvertedMessage = JSON.parse(messageString);
        const message = ChangeCaseUtil.convertKeysToCamelCase(unconvertedMessage);
        if (this.replyCallback) {
            this.replyCallback(message);
        } else {
            this.logger.error('No callback is registered for RPC reply');
        }
    }

    _close() {
        this.logger.info('App Server socket closed');
        this.connected = false;
        this.rabbitContext = null;

        if (this.disconnectCallback) {
            this.disconnectCallback();
        }
    }

    _error(error) {
        this.logger.error(`Channel error: ${error}`);
    }

    _connect() {
        if (this.connected) {
            return;
        }
        const address = RabbitMqUtils.createAddress(this.host);
        this.logger.info(`Connecting to RabbitMQ on ${address}`);
        async.waterfall([
            (callback) => RabbitMqUtils.createContext(address, this.requestQueueName, {
                onError: this._error,
                onClose: this._close
            }, callback),
            /**
             * @param {RabbitContext}rabbitContext
             * @param {function(Error, RabbitContext)}callback
             * */
            (rabbitContext, callback) => RabbitMqUtils.setQueryHandler(
                rabbitContext,
                rabbitContext.replyQueue,
                this._replyResult,
                true,
                (error) => callback(error, rabbitContext)
            ),
            (rabbitContext, callback) => {
                this.rabbitContext = rabbitContext;
                callback(null);
            }
        ], (error) => {
            if (error) {
                this.logger.error(`Failed to connect to RabbitMQ: ${error}`);
            } else {
                this.connected = true;
                if (this.connectCallback) {
                    this.connectCallback();
                }
            }
        });
    }
}

module.exports = RPCProxy;