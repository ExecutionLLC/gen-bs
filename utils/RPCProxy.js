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
    constructor(host, port, connectCallback, disconnectCallback, replyCallback) {
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.replyCallback = replyCallback;

        this.host = host;
        this.port = port;

        this.send = this.send.bind(this);

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
            this.replyCallback(message.error, {
                id: message.id, result: message.result
            });
        } else {
            console.error('No callback is registered for RPC reply');
        }
    }

    _close(event) {
        if (event.wasClean) {
            console.log('Socket closed (clean)', event);
        } else {
            console.log('Socket closed (unclean)', event);
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
        console.log('Socket error', event, this.ws.readyState);
    }

    _connect() {
        if (this.connected) return;

        const address = this._address();
        this.ws = new WebSocket(address);
        console.log('Connecting to the socket server on ' + address);

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