'use strict';

const RabbitMQ = require('amqplib/callback_api');
const async = require('async');

const RabbitMQPublisher = require('./RabbitMQPublisher');
const RabbitMQConsumer = require('./RabbitMQConsumer');

class RabbitMqUtils {
    static createConnection(host, port, user, password, callback) {
        const address = this._createAddress(host, port, user, password);
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
     * @param {number}port
     * @param {string}user
     * @param {string}password
     * */
    static _createAddress(host, port, user, password) {
        return `amqp://${user}:${password}@${host}:${port}`;
    }
}

module.exports = RabbitMqUtils;
