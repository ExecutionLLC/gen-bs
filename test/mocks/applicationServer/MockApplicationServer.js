'use strict';

const _ = require('lodash');
const async = require('async');

const RpcRouter = require('./RpcRouter');

const SearchHandler = require('./SearchHandler');
const RabbitMqUtils = require('../../../utils/rabbitMq/RabbitMqUtils');

class MockApplicationServer {
    constructor(services) {
        const {logger, config} = services;
        Object.assign(this, {services, config, logger}, {
            router: new RpcRouter(),
            /**@type {RabbitMQConsumer}*/
            taskConsumer: null,
            /**@type {RabbitMQConsumer}*/
            privateConsumer: null,
            /**@type {RabbitMQPublisher}*/
            publisher: null
        });

        this._sendResultToClients = this._sendResultToClients.bind(this);
        this.createClientMessageHandler = this.createClientMessageHandler.bind(this);

        const searchHandler = new SearchHandler(services);
        this.router.registerHandler(searchHandler);
    }

    start(callback) {
        const {host, port, user, password, virtualHost, requestExchangeName} = this.config.rabbitMq;
        async.waterfall([
            (callback) => RabbitMqUtils.createConnection(host, port, user, password, virtualHost, callback),
            (connection, callback) => {
                async.parallel({
                    connection: (callback) => callback(null, connection),
                    // Create task query consumer bound to all messages of the request exchange.
                    taskConsumer: (callback) => RabbitMqUtils.createConsumer(connection,
                        this.logger, null, requestExchangeName, ['#'], false, callback),
                    // Create private consumer for direct messages.
                    privateConsumer: (callback) => RabbitMqUtils.createConsumer(connection,
                        this.logger, null, null, null, false, callback),
                    publisher: (callback) => RabbitMqUtils.createPublisher(connection, this.logger, null, callback)
                }, callback);
            },
            (context, callback) => {
                Object.assign(this, context);
                callback(null);
            },
            (callback) => {
                this.privateConsumer.onMessage(this.createClientMessageHandler(true));
                this.taskConsumer.onMessage(this.createClientMessageHandler(false));
                callback(null);
            }
        ], callback);
    }

    /**
     * @param {boolean}isFromPrivateQueue
     * */
    createClientMessageHandler(isFromPrivateQueue) {
        return (message) => this.router.handleCall(message, isFromPrivateQueue,
            (results) => this._sendResultToClients(results, message)
        );
    }

    stop(callback) {
        this.privateConsumer.stop();
        this.taskConsumer.stop();
        this.publisher.stop();
        callback(null);
    }

    /**
     * @param {Object}result
     * @param {Object}originalMessage
     * */
    _sendResultToClients(result, originalMessage) {
        const {reply_to: replyQueueName} = originalMessage;
        const asQueueName = this.privateConsumer.getActualQueueName();
        if (replyQueueName) {
            this.publisher.publishToQueue(replyQueueName, result, {replyTo: asQueueName, correlationId: originalMessage.id}, (error) => {
                if (error) {
                    this.logger.error(`Error publishing message to ${replyQueueName}: ${error}`);
                }
            })
        } else {
            this.logger.error(`Original message ${JSON.stringify(originalMessage)} has no reply-to queue specified.`);
        }
    }
}

module.exports = MockApplicationServer;
