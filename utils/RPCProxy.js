'use strict';

const WebSocket = require('ws');

const ChangeCaseUtil = require('./ChangeCaseUtil');

const SocketState = {
    CONNECTING: 0,
    CONNECTED: 1,
    CLOSING: 2,
    CLOSED: 3
};

class RPCProxy {
    /**
     * @param {string}host
     * @param {number}port
     * @param {object}logger
     * @param {function()}connectCallback
     * @param {function()}disconnectCallback
     * @param {function(object)}replyCallback
     */
    constructor(host, port, logger, connectCallback, disconnectCallback, replyCallback) {
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.replyCallback = replyCallback;

        this.host = host;
        this.port = port;

        this.send = this.send.bind(this);
        this.logger = logger;

        // Try to reconnect automatically if connection is closed
        this.connected = false;
        setInterval(() => this._connect(), 1000);
    }

    isConnected() {
        return this.connected;
    }

    send(operationId, method, params, callback) {
        const convertedParams = ChangeCaseUtil.convertKeysToSnakeCase(params);
        const jsonData = this._formatJson(operationId, method, convertedParams);
        this.ws.send(jsonData, null, callback);
    }

    _formatJson(operationId, method, params) {
        return JSON.stringify({id: operationId, method: method, params: params});
    }

    _address() {
        return 'ws://' + this.host + ':' + this.port + '/ws';
    }

    _replyResult(messageString) {
        const unconvertedMessage = JSON.parse(messageString);
        const message = ChangeCaseUtil.convertKeysToCamelCase(unconvertedMessage);
        if (this.replyCallback) {
            this.replyCallback(message);
        } else {
            this.logger.error('No callback is registered for RPC reply');
        }
    }

    _close(event) {
        if (event.wasClean) {
            this.logger.info('Socket closed (clean)', event);
        } else {
            this.logger.info('Socket closed (unclean)', event);
        }

        if (this.disconnectCallback) {
            this.disconnectCallback();
        }
        if (!this.ws || this.ws.readyState == SocketState.CLOSED) {
            this.connected = false;
            this._connect();
        }
    }

    _error(event) {
        if (this.ws.readyState != SocketState.CONNECTED) {
            this.connected = false;
        }
        this.logger.error('Socket error', event, this.ws.readyState);
    }

    _connect() {
        if (this.connected) return;

        const address = this._address();
        this.ws = new WebSocket(address);
        this.logger.info('Connecting to the socket server on ' + address);

        this.connected = true;

        this.ws.on('message', this._replyResult.bind(this));
        this.ws.on('close', this._close.bind(this));
        this.ws.on('error', this._error.bind(this));

        if (this.connectCallback) {
            this.connectCallback();
        }
    }
}

module.exports = RPCProxy;