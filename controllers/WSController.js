'use strict';

const _ = require('lodash');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

// TODO: Move it to the model layer.
class WSController extends ControllerBase {
    constructor(services) {
        super(services);

        this.clients = [];
    }

    addWebSocketServerCallbacks(webSocketServer) {
        webSocketServer.on('connection', (ws) => {
            console.log('WS client connected');
            ws.on('message', (messageString) => {
                const message = JSON.parse(messageString);
                const clientDescriptor = this._findClientDescriptor(ws);
                const convertedMessage = ChangeCaseUtil.convertKeysToCamelCase(message);
                console.log('Received: ' + JSON.stringify(message, null, 2));
                console.log('In session: ' + clientDescriptor.sessionId);
                this._onClientMessage(ws, convertedMessage);
            });
            ws.on('error', error => {
                console.log('Error in client socket: ' + JSON.stringify(error, null, 2));
            });
            ws.on('close', () => {
                console.log('WS client disconnected');
            });

            this.clients.push({
                ws: ws,
                sessionId: null
            });
        });
    }

    _onClientMessage(clientWs, message) {
        const sessionId = message.sessionId;
        if (sessionId) {
            console.log('Connecting client WS to session ' + sessionId);
            const clientDescriptor = this._findClientDescriptor(clientWs);
            clientDescriptor.sessionId = sessionId;
        }
    }

    _findClientDescriptor(clientWs) {
        return _.find(this.clients, client => client.ws === clientWs);
    }
}

module.exports = WSController;