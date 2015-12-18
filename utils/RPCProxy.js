'use strict';

const WebSocket = require('ws');

class RPCProxy {
    constructor(host, port, connectCallback, disconnectCallback, replyCallback) {
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.replyCallback = replyCallback;

        this.host = host;
        this.port = port;

        this.connected = false;
        setInterval(() => this.connect(), 1000);
    }

    _address() {
        return 'ws://' + this.host + ':' + this.port;
    }

    _replyResult(message, flags) {
        if (this.replyCallback){
            const msg = JSON.parse(message);
            if(msg.error) {
                this.replyCallback(msg.error, {operation_id: msg.operation_id});
            } else {
                this.replyCallback(null, {operation_id: msg.operation_id, result: msg.result});
            }
        }
    }

    _close(event) {
        if (event.wasClean) {
            // TODO: add logger event here
            console.log('Socket closed (clear)', event);
        } else {
            // TODO: add logger event here
            console.log('Socket closed (unclear)', event);
        }
        if (this.disconnectCallback) {
            this.disconnectCallback();
        }
        if (!this.ws || this.ws.readyState == 3) {  // CLOSED
            this.connected = false;
            this.connect();
        }
    }

    _error(event) {
        if (this.ws.readyState !=1 ) {
            this.connected = false;
        }
        // TODO: add logger event here
        console.log('Socket error', event, this.wsreadyState);
    }

    connect() {
        if (this.connected) return;

        const address = this._address();
        this.ws = new WebSocket(address);
        console.log('Socket server is started on ' + address);

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
        return JSON.stringify({operation_id: operationId, method: method, params: [params]});
    }

    send(operationId, method, params) {
        var self = this;
        self.ws.on('open', function open() {
            self.ws.send(self._formatJson(operationId, method, params));
        });
    }
}

module.exports = RPCProxy;