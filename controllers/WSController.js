'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class WSController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    addWebSocketServerCallbacks(webSocketServer) {
        webSocketServer.on('connection', (ws) => {
            ws.on('message', (message) => {
                console.log('Received: ' + message);
                ws.send(message, (error) => {
                    if (error) {
                        console.error('Client WS send error', error);
                    }
                });
            });
        });
    }
}

module.exports = WSController;