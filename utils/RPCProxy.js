'use strict';

const WebSocket = require('ws');

class RPCProxy {
    constructor(host, port, replyCallback) {
        this.replyCallback = replyCallback;
        this.host = host;
        this.port = port;
        this.connect();
    }

    replyResult(message, flags) {
        var msg = JSON.parse(message);
        if(msg.error && (error !== undefined)) {
            this.replyCallback(msg.error, {operation_id: msg.operation_id});
        } else {
            this.replyCallback(null, {operation_id: msg.operation_id, result: msg.result});
        }
    }

    wsUrl() {
        return 'ws://' + this.host + ':' + this.port;
    }

    connect() {
        this.ws = new WebSocket(this.wsUrl());

        // TODO: add initial callback (applicationServer.requestOperations()) here

        this.ws.on('message', (message, flags) => {
            this.replyResult(message, flags);
        });

        this.ws.on('close', (event) => {
            if (event.wasClean) {
                // TODO: add logger event here
                console.log('Socket closed (clear)', event);
            } else {
                // TODO: add logger event here
                console.log('Socket closed (unclear)', event);
            }
            this.reconnect();
        });

        // TODO: что здесь? Как обрабатываем?
        this.ws.on('error', (error) => {
            // TODO: посмотреть как работает
            console.log('Socket error', error);
            this.reconnect();
        });
    }

    disconnect() {
        if (this.ws) {
            // TODO: посмотреть как работает и к чему приводит
            this.ws = null;
        }
    }

    reconnect() {
        // TODO: try reconnect? количество попыток соединения = ?
        this.disconnect();
        this.connect();
    }

    formatJson(operationId, method, params) {
        return JSON.stringify({operation_id: operationId, method: method, params: [params]});
    }

    send(operationId, method, params) {
        var self = this;
        self.ws.on('open', function open() {
            self.ws.send(self.formatJson(operationId, method, params));
        });
    }

}

module.exports = RPCProxy;