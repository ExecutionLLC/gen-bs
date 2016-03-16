'use strict';

const _ = require('lodash');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

/**
 * This controller handles client web socket connections,
 * associates them with sessions and sends application server
 * responses to proper client web sockets.
 * */
class WSController extends ControllerBase {
    constructor(services) {
        super(services);

        this.logger = this.services.logger;
        this.clients = [];

        this._subscribeAppServerReplyEvents();
    }

    addWebSocketServerCallbacks(webSocketServer) {
        webSocketServer.on('connection', (ws) => {
            this.logger.info('WS client connected');
            ws.on('message', (messageString) => {
                try {
                    const message = JSON.parse(messageString);
                    const clientDescriptor = this._findClientByWs(ws);
                    const convertedMessage = ChangeCaseUtil.convertKeysToCamelCase(message);
                    this.logger.info('Received: ' + JSON.stringify(message, null, 2));
                    this.logger.info('In session: ' + clientDescriptor.sessionId);
                    this._onClientMessage(ws, convertedMessage);
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
            });
            ws.on('error', error => {
                this.logger.error('Error in client socket: ' + JSON.stringify(error, null, 2));
            });
            ws.on('close', () => {
                this.logger.info('WS client disconnected');
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
            this.logger.info('Connecting client WS to session ' + sessionId);
            const clientDescriptor = this._findClientByWs(clientWs);
            clientDescriptor.sessionId = sessionId;
        }
    }

    _onServerReply(reply) {
        const sessionId = reply.sessionId;
        const client = this._findClientBySessionId(sessionId);
        if (client && client.ws) {
            this._sendClientMessage(client.ws, reply);
        } else {
            this.logger.warn('No client WS is found for session ' + sessionId);
        }
    }

    _sendClientMessage(clientWs, messageObject) {
        const preparedMessage = ChangeCaseUtil.convertKeysToSnakeCase(messageObject);
        const messageString = JSON.stringify(preparedMessage);
        clientWs.send(messageString, null, (error) => {
            if (error) {
                this.logger.error('Error sending client WS reply: ' + error);
            }
        });
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
        const searchEvents = this.services.search.registeredEvents();

        this.services.applicationServerReply.on(appServerReplyEvents.onOperationResultReceived, this._onServerReply.bind(this));
        this.services.search.on(searchEvents.onDataReceived, this._onServerReply.bind(this));
    }
}

module.exports = WSController;