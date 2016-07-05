'use strict';

const RabbitMQ = require('amqplib/callback_api');
const async = require('async');

const RabbitMQPublisher = require('./rabbitMq/RabbitMQPublisher');
const RabbitMQConsumer = require('./rabbitMq/RabbitMQConsumer');

/**
 * @typedef {Object}RabbitContext
 * @property {Object}connection
 * @property {Object}requestChannel
 * @property {string}requestQueue
 * @property {Object}replyChannel
 * @property {string}replyQueue
 * */

/**
 * @typedef {Object}ChannelHandlers
 * @property {function(Error)}onError
 * @property {function()}onClose
 * */

class RabbitMqUtils {
    static createConnection(host, callback) {
        const address = this._createAddress(host);
        RabbitMQ.connect(address, callback);
    }

    /**
     * @param {Object}connection
     * @param {Logger}logger
     * @param {(string|null)}exchangeName
     * @param {function(Error, RabbitMQPublisher)}callback
     * */
    static createPublisher(connection, logger, exchangeName, callback) {
        async.waterfall([
            (callback) => connection.createChannel(callback),
            (channel, callback) => {
                const publisher = new RabbitMQPublisher(logger, channel, exchangeName);
                callback(null, publisher);
            }
        ], callback);
    }

    /**
     * @param {Object}connection
     * @param {Logger}logger
     * @param {(string|null)}queueName
     * @param {(string|null)}exchangeName
     * @param {Array<string>|null}bindKeys
     * @param {boolean}noAck
     * @param {function(Error, RabbitMQConsumer)}callback
     */
    static createConsumer(connection, logger, queueName, exchangeName, bindKeys, noAck, callback) {
        async.waterfall([
            (callback) => connection.createChannel(callback),
            // (channel, callback) => {
            //     const exclusive = !queueName;
            //     channel.assertQueue(
            //         queueName,
            //         {exclusive},
            //         (error, queueDescriptor) => callback(error, channel, queueDescriptor)
            //     );
            // },
            // (channel, queueDescriptor, callback) => callback(null, channel, queueDescriptor.queue, callback),
            // // TODO: Here queue is registered twice.
            // (channel, queueName, callback) => {
            //     if (exchangeName && !_.isEmpty(bindKeys)) {
            //         bindKeys.forEach(key => channel.bindQueue(queueName, exchangeName, key))
            //     }
            //     callback(null, channel, queueName);
            // },
            (channel, callback) => {
                const consumer = new RabbitMQConsumer(logger, channel, queueName, noAck);
                consumer.init(exchangeName, bindKeys, (error) => callback(error, consumer));
            }
        ], callback);
    }

    /**
     * @param {string}address
     * @param {string}requestExchangeName
     * @param {ChannelHandlers}channelHandlers
     * @param {function({Error, RabbitContext})}callback
     * */
    static createContext(address, requestExchangeName, channelHandlers, callback) {
        async.waterfall([
            (callback) => RabbitMQ.connect(address, callback),
            (connection, callback) => {
                async.series({
                    requestChannel: (callback) => connection.createChannel(callback),
                    replyChannel: (callback) => connection.createChannel(callback)
                }, (error, channels) => callback(error, connection, channels));
            },
            (connection, channels, callback) => {
                async.series({
                    requestExchange: (callback) => this._obtainRequestExchange(channels.requestChannel, requestExchangeName, callback),
                    replyQueue: (callback) => this._obtainReplyQueue(channels.replyChannel, callback)
                }, (error, queues) => callback(error, Object.assign({}, queues, {connection}, channels)));
            },
            (rabbitContext, callback) => {
                const {requestChannel, replyChannel} = rabbitContext;
                [requestChannel, replyChannel].forEach((channel) => {
                    channel.on('error', channelHandlers.onError);
                    channel.on('close', channelHandlers.onClose);
                });
                callback(null, rabbitContext);
            }
        ], callback);
    }

    /**
     * @param {RabbitContext}rabbitContext
     * @param {function(Error)}callback
     * */
    static freeContext(rabbitContext, callback) {
        const {connection} = rabbitContext;
        connection.close();
        callback(null);
    }

    /**
     * @param {RabbitContext}rabbitContext
     * @param {function(string)}handler
     * @param {boolean}noAck
     * @param {function(Error)}callback
     * */
    static setRequestQueryHandler(rabbitContext, handler, noAck, callback) {
        const {requestChannel, requestQueue} = rabbitContext;
        requestChannel.consume(requestQueue, (message) => handler(message.content.toString()), {
            noAck
        });
        callback(null);
    }

    static setReplayQueryHandler(rabbitContext, handler, noAck, callback) {
        const {replyChannel, replayQueue} = rabbitContext;
        replyChannel.consume(replayQueue, (message) => handler(message.content.toString()), {
            noAck
        });
        callback(null);
    }

    /**
     * @param {RabbitContext}rabbitContext
     * @param {string}queueName
     * @param {Object}messageObject
     * @param {function(Error)}callback
     * */
    static sendRequestJson(rabbitContext, queueName, messageObject, callback) {
        const {requestChannel} = rabbitContext;
        const messageString = JSON.stringify(messageObject);
        requestChannel.sendToQueue(queueName, new Buffer(messageString));
        callback(null);
    }

    static _obtainRequestExchange(channel, requestExchangeName, callback) {
        channel.assertExchange(requestExchangeName, 'topic', {
            durable: false
        });
        callback(null);
    }

    static _obtainReplyQueue(channel, callback) {
        this._obtainQueue(channel, null, {
            exclusive: true,
            durable: false
        }, callback);
    }

    static _obtainQueue(channel, queueName, queueParams, callback) {
        async.waterfall([
            (callback) => channel.assertQueue(queueName, queueParams, callback),
            (queueDescriptor, callback) => callback(null, queueDescriptor.queue)
        ], callback);
    }

    /**
     * @param {string}host
     * */
    static _createAddress(host) {
        return `amqp://${host}`;
    }
}

module.exports = RabbitMqUtils;
