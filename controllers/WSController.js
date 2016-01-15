'use strict';

const _ = require('lodash');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

// TODO: Move it to the model layer.
class WSController extends ControllerBase {
    constructor(services) {
        super(services);

        this.clients = [];

        this._subscribeAppServerReplyEvents();
    }

    addWebSocketServerCallbacks(webSocketServer) {
        webSocketServer.on('connection', (ws) => {
            console.log('WS client connected');
            ws.on('message', (messageString) => {
                const message = JSON.parse(messageString);
                const clientDescriptor = this._findClientByWs(ws);
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
                ws,
                sessionId: null
            });
        });
    }

    _onClientMessage(clientWs, message) {
        const sessionId = message.sessionId;
        if (sessionId) {
            console.log('Connecting client WS to session ' + sessionId);
            const clientDescriptor = this._findClientByWs(clientWs);
            clientDescriptor.sessionId = sessionId;
        }
    }

    _onServerReply(reply) {
        const sessionId = reply.sessionId;
        const client = this._findClientBySessionId(sessionId);
        if (client && client.ws) {
            client.ws.send(JSON.stringify(reply));
        } else {
            console.log('No client WS is found for session ' + sessionId);
        }
    }

    _findClientByWs(clientWs) {
        return _.find(this.clients, client => client.ws === clientWs);
    }

    _findClientBySessionId(sessionId) {
        return _.find(this.clients, client => client.sessionId === sessionId);
    }

    /**
     * Here are the places where web socket messages are formed.
     * */
    _subscribeAppServerReplyEvents() {
        const appServerReplyEvents = this.services.applicationServerReply.registeredEvents();
        const redisEvents = this.services.redis.registeredEvents();

        this.services.applicationServerReply.on(appServerReplyEvents.onOperationResultReceived, this._onServerReply.bind(this));
        this.services.redis.on(redisEvents.dataReceived, this._onServerReply.bind(this));
    }
}

module.exports = WSController;