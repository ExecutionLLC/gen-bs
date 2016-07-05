'use strict';

const _ = require('lodash');

const RabbitMQHandlerBase = require('./RabbitMQHandlerBase');

class RabbitMQPublisher extends RabbitMQHandlerBase {
    constructor(logger, channel, exchangeName) {
        super(channel, logger);

        Object.assign(this, {exchangeName});

        _.bindAll(this, ['_onMessageReturned']);

        if (exchangeName) {
            channel.assertExchange(exchangeName, 'topic', {
                durable: false
            });
        }

        channel.on('return', this._onMessageReturned);
        this.connected = true;
    }

    /**
     * @param {Object}messageObject
     * @param {string}key
     * @param {function(Error)}callback
     * */
    publishToDefaultExchange(messageObject, key, callback) {
        const messageString = JSON.stringify(messageObject);
        const message = new Buffer(messageString);
        const replyTo = messageObject.replyTo;
        this.channel.publish(this.exchangeName, key, message, {
            mandatory: true,
            replyTo
        });
        callback(null);
    }

    publishToQueue(queueName, messageObject, callback) {
        const messageString = JSON.stringify(messageObject);
        const message = new Buffer(messageString);
        const replyTo = messageObject.replyTo;
        this.channel.sendToQueue(queueName, message, {
            mandatory: true,
            replyTo
        });
        callback(null);
    }

    /**
     * Sets handler to execute when message is not delivered.
     *
     * @param {function(Object)}handler
     * */
    onMessageReturned(handler) {
        this.messageReturnHandler = handler;
    }

    _onMessageReturned(message) {
        const messageString = message.content.toString();
        const messageObject = JSON.parse(messageString);
        if (this.messageReturnHandler) {
            this.messageReturnHandler(messageObject);
        } else {
            this.logger.error(
                `Message returned but no handler is registered to`
                + ` message returns on exchange ${this.exchangeName}.`
                + ` Message: ${messageString}`
            );
        }
    }
}

module.exports = RabbitMQPublisher;
