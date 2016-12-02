'use strict';

class AmpqConnectionClosed extends Error {
    constructor(message) {
        super(message || 'The AMQP connection was closed');
    }
}

module.exports = AmpqConnectionClosed;
