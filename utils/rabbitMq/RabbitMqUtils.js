'use strict';

const RabbitMQ = require('amqplib/callback_api');
const async = require('async');

const RabbitMQPublisher = require('./RabbitMQPublisher');
const RabbitMQConsumer = require('./RabbitMQConsumer');

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
            (channel, callback) => {
                const consumer = new RabbitMQConsumer(logger, channel, queueName, noAck);
                consumer.init(exchangeName, bindKeys, (error) => callback(error, consumer));
            }
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
