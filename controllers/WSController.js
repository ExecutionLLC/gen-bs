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
                try {
                    const message = JSON.parse(messageString);
                    const clientDescriptor = this._findClientByWs(ws);
                    const convertedMessage = ChangeCaseUtil.convertKeysToCamelCase(message);
                    console.log('Received: ' + JSON.stringify(message, null, 2));
                    console.log('In session: ' + clientDescriptor.sessionId);
                    this._onClientMessage(ws, convertedMessage);
                } catch (e) {
                    console.error('Client WS message parse error: ' + JSON.stringify(e));
                    const error = {
                        message:'Error parsing message:' + JSON.stringify(e)
                    };
                    ws.send(JSON.stringify(error), null, (error) => {
                        if (error) {
                            console.error('Error sending response to the client: ' + JSON.stringify(error));
                        }
                    })
                }
            });
            ws.on('error', error => {
                console.log('Error in client socket: ' + JSON.stringify(error, null, 2));
            });
            ws.on('close', () => {
                console.log('WS client disconnected');
                this._removeClientByWs(ws);
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
            client.ws.send(JSON.stringify(reply), null, (error) => {
                if (error) {
                    console.error('Error sending client WS reply: ' + JSON.stringify(error));
                }
            });
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

    _removeClientByWs(clientWs) {
        const index = _.findIndex(this.clients, (client) => client.ws === clientWs);
        this.clients.splice(index, 1);
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