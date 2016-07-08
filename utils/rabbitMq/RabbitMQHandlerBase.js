'use strict';

const _ = require('lodash');

/**
 * @typedef {Object}RabbitMessageOptions
 * @property {boolean}[mandatory]
 * @property {string}[replyTo]
 * @property {string}[messageId]
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
 * @typedef {Object}RabbitMQChannel
 * @property {ChannelPublish}publish
 * @property {ChannelSendToQueue}sendToQueue
 * @method close
 * */

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
}

module.exports = RabbitMQHandlerBase;
