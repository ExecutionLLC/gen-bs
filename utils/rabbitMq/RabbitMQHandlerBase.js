'use strict';

const _ = require('lodash');

/**
 * @typedef {Object}RabbitMessageOptions
 * @property {boolean}[mandatory]
 * @property {string}[replyTo]
 * @property {string}[messageId]
 * */

/**
 * @typedef {Object}RabbitExchangeOptions
 * @property {boolean}[durable]
 * @property {boolean}[internal]
 * @property {boolean}[autoDelete]
 * @property {string}[alternateExchange]
 * @property {Object}[arguments]
 * */

/**
 * @typedef {Object}RabbitQueueOptions
 * @property {boolean}[exclusive]
 * @property {boolean}[durable]
 * @property {boolean}[autoExclusive]
 * @property {Object}[arguments]
 * */

/**
 * @callback ChannelPublish
 * @param {(string|undefined)}exchangeName
 * @param {string}routingKey Routing key or, when exchangeName is null, queue name.
 * @param {Buffer}messageContent
 * @param {RabbitMessageOptions}options
 * */

/**
 * @callback ChannelSendToQueue
 * @param {(string|null)}queueName
 * @param {Buffer}messageContent
 * @param {RabbitMessageOptions}options
 * */

/**
 * @callback ChannelAssertExchange
 * @param {string}exchangeName
 * @param {string}type
 * @param {RabbitExchangeOptions}options
 * */

/**
 * @callback ChannelAssertQueue
 * @param {(string|null)}queueName
 * @param {(RabbitQueueOptions|null)}options
 * @param {function(Error, boolean)}callback
 * */

/**
 * @typedef {Object}RabbitMQChannel
 * @property {ChannelPublish}publish
 * @property {ChannelSendToQueue}sendToQueue
 * @property {ChannelAssertExchange}assertExchange
 * @property {ChannelAssertQueue}assertQueue
 * @method close
 * */

/**
 * @readonly
 * @enum {string}
 * */
const EXCHANGE_TYPES = {
    FANOUT: 'fanout',
    TOPIC: 'topic',
    DIRECT: 'direct',
    HEADERS: 'match'
};

class RabbitMQHandlerBase {
    constructor(channel, logger) {
        Object.assign(this, {
            /**@type {RabbitMQChannel}*/
            channel,
            logger,
            connected: false
        });

        _.bindAll(this, ['isConnected', '_onChannelError', '_onChannelClose']);

        channel.on('error', this._onChannelError);
        channel.on('close', this._onChannelClose);
    }

    isConnected() {
        return this.connected;
    }

    stop() {
        this.channel.close((error) => error && console.log(`Error stopping mock app server: ${error}`));
    }

    _onChannelError(error) {
        this.logger.error(`Channel error: ${error}`);
        this.connected = false;
    }

    _onChannelClose() {
        this.logger.info('Channel is closed');
        this.connected = false;
    }

    static exchangeTypes() {
        return EXCHANGE_TYPES;
    }
}

module.exports = RabbitMQHandlerBase;
