'use strict';

const RabbitMQ = require('amqplib/callback_api');
const async = require('async');

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
    /**
     * @param {string}host
     * */
    static createAddress(host) {
        return `amqp://${host}`;
    }

    /**
     * @param {string}address
     * @param {string}requestQueueName
     * @param {ChannelHandlers}channelHandlers
     * @param {function({Error, RabbitContext})}callback
     * */
    static createContext(address, requestQueueName, channelHandlers, callback) {
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
                    requestQueue: (callback) => this._obtainRequestQueue(channels.requestChannel, requestQueueName, callback),
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

    static _obtainRequestQueue(channel, requestQueueName, callback) {
        this._obtainQueue(channel, requestQueueName, {
            durable: false
        }, callback);
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
}

module.exports = RabbitMqUtils;
