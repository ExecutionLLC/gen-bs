'use strict';

const _ = require('lodash');
const async = require('async');

const RabbitMqUtils = require('./RabbitMqUtils');
const ChangeCaseUtil = require('./ChangeCaseUtil');

class RPCProxy {
    /**
     * @param {string}host RabbitMQ host.
     * @param {string}requestExchangeName Name of the task queue.
     * @param {number}reconnectTimeout Timeout in milliseconds
     * @param {object}logger
     * @param {function(object)}replyCallback
     */
    constructor(host, requestExchangeName, reconnectTimeout, logger, replyCallback) {
        Object.assign(this,
            {host, requestExchangeName, reconnectTimeout, logger, replyCallback}, {
                consumer: null,
                publisher: null,
                connecting: false
            }
        );
        _.bindAll(this, ['_onMessage', '_onMessageReturned', '_connect', 'send']);
        // Try to reconnect automatically if connection is closed
        this._connect();
        setInterval(this._connect, reconnectTimeout);
    }

    isConnected() {
        return this.publisher && this.publisher.isConnected()
            && this.consumer && this.consumer.isConnected();
    }

    send(operationId, method, params, queryNameOrNull, callback) {
        if (!this.isConnected()) {
            callback(new Error('Connection to application server is lost.'));
        } else {
            const publisher = this.publisher;
            const replyQueue = this.consumer.getActualQueueName();
            const fullParams = Object.assign({}, params, {
                replyTo: replyQueue
            });
            const convertedParams = ChangeCaseUtil.convertKeysToSnakeCase(fullParams);
            const message = this._constructMessage(operationId, method, convertedParams);
            // Can send requests either to a particular AS instance, or to the tasks exchange.
            if (queryNameOrNull) {
                publisher.publishToQueue(queryNameOrNull, message, callback);
            } else {
                publisher.publishToDefaultExchange(message, method, callback);
            }
        }
    }

    onMessageReturned(handler) {
        this.messageReturnedHandler = handler;
    }

    _constructMessage(operationId, method, params) {
        return {id: operationId, method: method, params: params};
    }

    _onMessageReturned(messageObject) {
        if (this.messageReturnedHandler) {
            this.messageReturnedHandler(messageObject);
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
            (callback) => RabbitMqUtils.createConnection(this.host, callback),
            (connection, callback) => {
                async.series({
                    publisher: (callback) => RabbitMqUtils.createPublisher(connection,
                        this.logger, this.requestExchangeName, callback),
                    consumer: (callback) => RabbitMqUtils.createConsumer(connection,
                        this.logger, null, null, null, true, callback)
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