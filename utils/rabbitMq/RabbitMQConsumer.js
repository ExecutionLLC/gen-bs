'use strict';

const _ = require('lodash');
const async = require('async');

const RabbitMQHandlerBase = require('./RabbitMQHandlerBase');

class RabbitMQConsumer extends RabbitMQHandlerBase {
    constructor(logger, channel, queueName, noAck) {
        super(channel, logger);

        Object.assign(this,
            {logger, channel, queueName, noAck}, {
            messageHandler: null
        });

        _.bindAll(this, ['_onMessage']);
    }

    getActualQueueName() {
        return this.actualQueueName;
    }

    /**
     * @param {(string|null)}exchangeNameOrNull
     * @param bindKeysOrNull
     * @param callback
     * */
    init(exchangeNameOrNull, bindKeysOrNull, callback) {
        const exclusive = !this.queueName;
        async.waterfall([
            (callback) => this.channel.assertQueue(this.queueName, {exclusive}, callback),
            (queueDescriptor, callback) => callback(null, queueDescriptor.queue),
            (queueName, callback) => {
                if (exchangeNameOrNull && !_.isEmpty(bindKeysOrNull)) {
                    bindKeysOrNull.forEach(key => this.channel.bindQueue(queueName, exchangeNameOrNull, key))
                }
                callback(null, queueName);
            },
            (queueName, callback) => {
                this.actualQueueName = queueName;
                this.channel.consume(queueName, this._onMessage, {
                    noAck: this.noAck
                });

                this.connected = true;
                callback(null);
            }
        ], callback);
    }

    /**@param {function(Object, Object)}handler (Our message contents, original RMQ message)*/
    onMessage(handler) {
        this.messageHandler = handler;
    }

    ackMessage(rabbitMessage) {
        this.channel.ack(rabbitMessage);
    }

    _onMessage(rabbitMessage) {
        const messageString = rabbitMessage.content.toString();
        const {properties:{replyTo}} = rabbitMessage;
        try {
            const messageObject = JSON.parse(messageString);
            if (replyTo) {
                messageObject.replyTo = replyTo;
            }
            if (this.messageHandler) {
                this.messageHandler(messageObject, rabbitMessage);
            } else {
                this.logger.error(
                    `Message come but no handler is registered in consumer for queue ${this.queueName}.`
                    + ` Message: ${messageString}.`
                );
            }
        } catch (error) {
            this.logger.error(`Error while consuming message from queue ${this.getActualQueueName()}: ${error}`);
        }
    }
}

module.exports = RabbitMQConsumer;
