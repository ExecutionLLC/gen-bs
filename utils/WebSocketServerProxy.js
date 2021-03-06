'use strict';

const assert = require('assert');

class WebSocketServerProxy {
    constructor() {
        this.clients = [];
        this.messageHandler = null;

        this.sendToAll = this.sendToAll.bind(this);
    }

    addWebSocketCallbacks(webSocketServer) {
        webSocketServer.on('connection', (wsClient) => {
            this.clients.push(wsClient);

            wsClient.on('message', (messageString) => {
                this.messageHandler && this.messageHandler(wsClient, messageString);
                !this.messageHandler && console.error('No handler is registered for client messages in web socket.');
            });

            wsClient.on('error', (error) => {
                console.log('Error in client web socket', error);
            });

            wsClient.on('close', () => {
                const clientIndex = this.clients.indexOf(wsClient);
                this.clients.splice(clientIndex);
                if (this.closeHandler) {
                    this.closeHandler(wsClient);
                }
            });

            if (this.connectHandler) {
                this.connectHandler(wsClient);
            }
        });
    }

    /**
     * @params {String}messageString
     * */
    sendToAll(messageString) {
        this.clients.forEach(ws => ws.send(messageString));
    }

    /**
     * @param {function(Object)}handler
     * */
    onConnect(handler) {
        this.connectHandler = handler;
    }

    /**
     * @param {function(Object, String)}handler
     * */
    onMessage(handler) {
        this.messageHandler = handler;
    }

    /**
     * @param {function(Object)}handler
     * */
    onClose(handler) {
        this.closeHandler = handler;
    }
}

module.exports = WebSocketServerProxy;
