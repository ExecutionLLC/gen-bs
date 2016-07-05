'use strict';

const _ = require('lodash');

class RabbitMQHandlerBase {
    constructor(channel, logger) {
        Object.assign(this, {
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
