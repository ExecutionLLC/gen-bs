'use strict';

const _ = require('lodash');
const async = require('async');

const RabbitMqUtils = require('./rabbitMq/RabbitMqUtils');
const ChangeCaseUtil = require('./ChangeCaseUtil');

/**
 * @typedef {Object}RpcProxyParams
 * @property {string}host RabbitMQ host.
 * @property {number}port
 * @property {string}user
 * @property {string}password
 * @property {string}virtualHost
 * @property {string}requestExchangeName Name of the task queue.
 * @property {number}reconnectTimeout Timeout in milliseconds
 * @property {object}logger
 * @property {function(Object)}replyCallback
 * */

const MAX_PRIORITY = 255;

class RPCProxy {
    /**
     * @param {RpcProxyParams}params
     */
    constructor(params) {
        Object.assign(this, params, {
            consumer: null,
            publisher: null
        });
        _.bindAll(this, ['_onMessage', '_onMessageReturned', '_connect', 'send']);
        // Try to reconnect automatically if connection is closed
        this._connect();
        setInterval(this._connect, params.reconnectTimeout);
    }

    isConnected() {
        return this.publisher && this.publisher.isConnected()
            && this.consumer && this.consumer.isConnected();
    }

    /**
     * @param messageId
     * @param method AS method name to call
     * @param params AS method params
     * @param queryNameOrNull If null, msg will be sent to the default exchange.
     * @param priorityOrNull If null, msg will have max priority
     * @param callback(Error)
     * */
    send(messageId, method, params, queryNameOrNull, priorityOrNull, callback) {
        if (!this.isConnected()) {
            callback(new Error('Connection to application server is lost.'));
        } else {
            const publisher = this.publisher;
            const replyQueue = this.consumer.getActualQueueName();
            const message = this._constructMessage(messageId, method, replyQueue, params);
            const messageParams = {
                replyTo: replyQueue,
                correlationId: messageId,
                priority: priorityOrNull !== null ? priorityOrNull : MAX_PRIORITY
            };
            // Can send requests either to a particular AS instance, or to the tasks exchange.
            if (queryNameOrNull) {
                publisher.publishToQueue(queryNameOrNull, message, messageParams, callback);
            } else {
                publisher.publishToDefaultExchange(message, method, messageParams, callback);
            }
        }
    }

    _constructMessage(id, method, replyTo, params) {
        const message = {id, method, params, replyTo};
        return ChangeCaseUtil.convertKeysToSnakeCase(message);
    }

    _onMessageReturned(messageObject) {
        if (this.returnCallback) {
            this.returnCallback(messageObject);
        } else {
            this.logger.error(
                `Message returned but no handler is registered to`
                + ` message returns. Message: ${JSON.stringify(messageObject)}`
            );
        }
    }

    _onMessage(unconvertedMessage) {
        const message = ChangeCaseUtil.convertKeysToCamelCase(unconvertedMessage);
        if (this.replyCallback) {
            this.replyCallback(message);
        } else {
            this.logger.error('No callback is registered for RPC reply');
        }
    }

    _connect() {
        if (this.isConnected()) {
            return;
        }

        this.logger.info(`Connecting to RabbitMQ on ${this.host}`);
        async.waterfall([
            (callback) => RabbitMqUtils.createConnection(this.host, this.port, this.user, this.password, this.virtualHost, callback),
            (connection, callback) => {
                async.parallel({
                    publisher: (callback) => RabbitMqUtils.createPublisher(connection,
                        this.logger, this.requestExchangeName, callback),
                    consumer: (callback) => RabbitMqUtils.createConsumer(connection,
                        this.logger, this.wsQueueName, null, null, true, callback)
                }, (error, context) => callback(error, context))
            },
            (context, callback) => {
                const {publisher, consumer} = context;
                callback(null, publisher, consumer);
            },
            /**
             * @param {RabbitMQPublisher}publisher
             * @param {RabbitMQConsumer}consumer
             * @param {function(Error)}callback
             * */
            (publisher, consumer, callback) => {

                publisher.onMessageReturned(this._onMessageReturned);
                consumer.onMessage(this._onMessage);

                this.publisher = publisher;
                this.consumer = consumer;
                callback(null);
            }
        ], (error) => {
            if (error) {
                this.logger.error(`Failed to connect to RabbitMQ: ${error} ${error.stack}`);
            }
        });
    }
}

module.exports = RPCProxy;