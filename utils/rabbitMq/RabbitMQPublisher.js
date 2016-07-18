'use strict';

const _ = require('lodash');

const RabbitMQHandlerBase = require('./RabbitMQHandlerBase');

class RabbitMQPublisher extends RabbitMQHandlerBase {
    constructor(logger, channel, exchangeName) {
        super(channel, logger);

        Object.assign(this, {exchangeName});

        _.bindAll(this, ['_onMessageReturned']);

        if (exchangeName) {
            channel.assertExchange(exchangeName, RabbitMQHandlerBase.exchangeTypes().TOPIC, {
                durable: false,
                autoDelete: true
            });
        }

        channel.on('return', this._onMessageReturned);
        this.connected = true;
    }

    /**
     * @param {Object}messageObject
     * @param {string}key
     * @param {(RabbitMessageOptions|null)}rabbitParams
     * @param {function(Error)}callback
     * */
    publishToDefaultExchange(messageObject, key, rabbitParams, callback) {
        const messageString = JSON.stringify(messageObject);
        const message = new Buffer(messageString);
        const messageParams = Object.assign({}, {mandatory: true}, rabbitParams);
        this.channel.publish(this.exchangeName, key, message, messageParams);
        callback(null);
    }

    /**
     * @param {string}queueName
     * @param {Object}messageObject
     * @param {(RabbitMessageOptions|null)}rabbitParams
     * @param {function(Error)}callback
     * */
    publishToQueue(queueName, messageObject, rabbitParams, callback) {
        const messageString = JSON.stringify(messageObject);
        const message = new Buffer(messageString);
        const rabbitMessageParams = Object.assign({}, {mandatory: true}, rabbitParams);
        this.channel.sendToQueue(queueName, message, rabbitMessageParams);
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
