'use strict';

const WebSocket = require('ws');

const SocketState = {
    CONNECTED: 1,
    CLOSED: 3
};

class RPCProxy {
    constructor(host, port, connectCallback, disconnectCallback, replyCallback) {
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.replyCallback = replyCallback;

        this.host = host;
        this.port = port;

        this.connected = false;
        setInterval(() => this._connect(), 1000);
    }

    _address() {
        return 'ws://' + this.host + ':' + this.port + '/ws';
    }

    _replyResult(message, flags) {
        if (this.replyCallback){
            const msg = JSON.parse(message);
            if(msg.error) {
                this.replyCallback(msg.error, {id: msg.id});
            } else {
                this.replyCallback(null, {id: msg.id, result: msg.result});
            }
        }
    }

    _close(event) {
        if (event.wasClean) {
            console.log('Socket closed (clear)', event);
        } else {
            console.log('Socket closed (unclear)', event);
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

    _formatJson(operationId, method, params) {
        return JSON.stringify({id: operationId, method: method, params: [params]});
    }

    send(operationId, method, params) {
        var self = this;
        self.ws.send(self._formatJson(operationId, method, params));
    }
}

module.exports = RPCProxy;