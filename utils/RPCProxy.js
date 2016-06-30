'use strict';

const _ = require('lodash');
const async = require('async');
const RabbitMQ = require('amqplib/callback_api');

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
            const {channel, requestQueue, replyQueue} = this.rabbitContext;
            const fullParams = Object.assign({}, params, {
                replyTo: replyQueue
            });
            const convertedParams = ChangeCaseUtil.convertKeysToSnakeCase(fullParams);
            const messageString = this._stringifyMessage(operationId, method, convertedParams);
            // Can send requests either to a particular AS instance, or to the tasks queue.
            const actualQueryName = queryNameOrNull || requestQueue;
            channel.sendToQueue(actualQueryName, new Buffer(messageString));
        }
    }

    _stringifyMessage(operationId, method, params) {
        return JSON.stringify({id: operationId, method: method, params: params});
    }

    _address() {
        return `amqp://${this.host}`;
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

        async.waterfall([
            (callback) => this._acquireRabbitContext(callback),
            /**
             * @param {RabbitContext}rabbitContext
             * @param {function()}callback
             * */
            (rabbitContext, callback) => this._setQueryHandlers(rabbitContext, callback),
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

    /**
     * @param {RabbitContext}rabbitContext
     * @param {function(Error)}callback
     * */
    _setQueryHandlers(rabbitContext, callback) {
        const {channel, replyQueue} = rabbitContext;
        channel.consume(
            replyQueue,
            (message) => this._replyResult(message.content.toString()), {
                noAck: true
            }
        );
        callback(null);
    }

    /**
     * @typedef {Object}RabbitContext
     * @property {Object}connection
     * @property {Object}channel
     * @property {Object}requestQueue
     * @property {Object}replyQueue
     * */

    /**
     * @param {function({Error, RabbitContext})}callback
     * */
    _acquireRabbitContext(callback) {
        const address = this._address();
        this.logger.info(`Connecting to RabbitMQ on ${address}`);
        async.waterfall([
            (callback) => RabbitMQ.connect(address, callback),
            (connection, callback) => connection.createChannel(
                (error, channel) => callback(error, connection, channel)
            ),
            (connection, channel, callback) => {
                async.series({
                    requestQueue: (callback) => this._obtainRequestQueue(channel, callback),
                    replyQueue: (callback) => this._obtainReplyQueue(channel, callback)
                }, (error, queues) => callback(error, Object.assign({}, queues, {connection, channel})));
            },
            (rabbitContext, callback) => {
                const {channel} = rabbitContext;
                channel.on('error', this._error);
                channel.on('close', this._close);
                callback(null, rabbitContext);
            }
        ], callback);
    }

    _obtainRequestQueue(channel, callback) {
        this._obtainQueue(channel, this.requestQueueName, {
            durable: false
        }, callback);
    }

    _obtainReplyQueue(channel, callback) {
        this._obtainQueue(channel, null, {
            exclusive: true,
            durable: false
        }, callback);
    }

    _obtainQueue(channel, queueName, queueParams, callback) {
        async.waterfall([
            (callback) => channel.assertQueue(queueName, queueParams, callback),
            (queueDescriptor, callback) => callback(null, queueDescriptor.queue)
        ], callback);
    }
}

module.exports = RPCProxy;