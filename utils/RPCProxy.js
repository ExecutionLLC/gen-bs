'use strict';

const WebSocket = require('ws');

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

        // Try to reconnect automatically if connection is closed
        this.connected = false;
        setInterval(() => this._connect(), 1000);
    }

    send(operationId, method, params, callback) {
        const jsonData = this._formatJson(operationId, method, params);
        this.ws.send(jsonData, null, callback);
    }

    _formatJson(operationId, method, params) {
        return JSON.stringify({id: operationId, method: method, params: params});
    }

    _address() {
        return 'ws://' + this.host + ':' + this.port + '/ws';
    }

    _replyResult(message) {
        if (this.replyCallback) {
            const msg = JSON.parse(message);
            this.replyCallback(msg.error, {
                id: msg.id, result: msg.result
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

        this.ws.on('message', (message, flags) => {
            this._replyResult(message, flags);
        });

        this.ws.on('close', (event) => {
            this._close(event);
        });

        this.ws.on('error', (event) => {
            this._error(event);
        });

        if (this.connectCallback) {
            this.connectCallback();
        }
    }
}

module.exports = RPCProxy;