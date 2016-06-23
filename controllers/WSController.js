'use strict';

const _ = require('lodash');

const ControllerBase = require('./base/ControllerBase');
const WebSocketServerProxy = require('../utils/WebSocketServerProxy');

/**
 * This controller handles client web socket connections,
 * associates them with sessions and sends application server
 * responses to proper client web sockets.
 * */
class WSController extends ControllerBase {
    constructor(services) {
        super(services);

        this.logger = this.services.logger;
        this.webSocketServerProxy = new WebSocketServerProxy();
        this.clients = [];

        this.webSocketServerProxy.onMessage(this._onClientMessage.bind(this));
        this.webSocketServerProxy.onClose(this._onClientDisconnected.bind(this));
        this.webSocketServerProxy.onConnect(this._onClientConnected.bind(this));

        this._subscribeAppServerReplyEvents();
    }

    addWebSocketServerCallbacks(webSocketServer) {
        this.webSocketServerProxy.addWebSocketCallbacks(webSocketServer);
    }

    _onServerReply(reply) {
        _.each(reply.sessionIds, sessionId => {
            const client = this._findClientBySessionId(sessionId);
            if (client && client.ws) {
                this._sendClientMessage(client.ws, reply);
            } else {
                this.logger.warn('No client WS is found for session ' + sessionId);
            }
        });
    }

    _sendClientMessage(clientWs, messageObject) {
        const messageString = JSON.stringify(messageObject);
        clientWs.send(messageString, null, (error) => {
            if (error) {
                this.logger.error('Error sending client WS reply: ' + error);
            } else {
                this.logger.trace('Message sent: ' + JSON.stringify(messageObject, null, 2));
            }
        });
    }

    _onClientMessage(ws, messageString) {
        try {
            const message = JSON.parse(messageString);
            const clientDescriptor = this._findClientByWs(ws);
            this.logger.info('Client message for session ' + clientDescriptor.sessionId);
            this.logger.info(JSON.stringify(message, null, 2));

            const sessionId = message.sessionId;
            if (sessionId) {
                this.logger.info('Connecting client WS to session ' + sessionId);
                const clientDescriptor = this._findClientByWs(ws);
                clientDescriptor.sessionId = sessionId;
            } else {
                this.logger.error('Unknown client message in web-socket.');
            }
        } catch (e) {
            this.logger.error('Client WS message parse error: ' + JSON.stringify(e));
            const error = {
                result: {
                    error:'Error parsing message:' + JSON.stringify(e)
                }
            };
            ws.send(JSON.stringify(error), null, (error) => {
                if (error) {
                    this.logger.error('Error sending response to the client: ' + JSON.stringify(error));
                }
            });
        }
    }

    _onClientConnected(ws) {
        this.logger.info('WS client connected');
        this.clients.push({
            ws,
            sessionId: null
        });
    }

    _onClientDisconnected(clientWs) {
        this.logger.info('WS client disconnected');
        const index = _.findIndex(this.clients, (client) => client.ws === clientWs);
        this.clients.splice(index, 1);
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
        const searchEvents = this.services.search.registeredEvents();

        this.services.applicationServerReply.on(appServerReplyEvents.onOperationResultReceived, this._onServerReply.bind(this));
        this.services.search.on(searchEvents.onDataReceived, this._onServerReply.bind(this));
    }
}

module.exports = WSController;