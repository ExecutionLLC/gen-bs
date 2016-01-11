'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

// TODO: Move it to the model layer.
class WSController extends ControllerBase {
    constructor(services) {
        super(services);

        this.clientsBySession = {};
    }

    addWebSocketServerCallbacks(webSocketServer) {
        webSocketServer.on('connection', (ws) => {
            console.log('WS client connected');
            ws.on('message', (messageString) => {
                const message = JSON.parse(messageString);
                const convertedMessage = ChangeCaseUtil.convertKeysToCamelCase(message);
                console.log('Received: ' + JSON.stringify(message, null, 2));
                this.onClientMessage(ws, convertedMessage);
            });
            ws.on('error', error => {
                console.log('Error in client socket: ' + JSON.stringify(error, null, 2));
            });
            ws.on('close', () => {
                console.log('WS client disconnected');
            });
        });
    }

    onClientMessage(clientWs, message) {
        const sessionId = message.sessionId;
        if (sessionId) {
            console.log('Connecting client WS to session ' + sessionId);
            this.clientsBySession[sessionId] = clientWs;
        }
    }
}

module.exports = WSController;