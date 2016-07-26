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
        /**@type {Array<WebSocketClient>}**/
        this.clients = [];

        this.webSocketServerProxy.onMessage(this._onClientMessage.bind(this));
        this.webSocketServerProxy.onClose(this._onClientDisconnected.bind(this));
        this.webSocketServerProxy.onConnect(this._onClientConnected.bind(this));

        this._subscribeAppServerReplyEvents();
    }

    addWebSocketServerCallbacks(webSocketServer) {
        this.webSocketServerProxy.addWebSocketCallbacks(webSocketServer);
    }

    verifyWebSocketClient(info, callback) {
        const sessionParser = this.services.sessions.getSessionParserMiddleware();
        // Allow connection only in case session is properly initialized.
        sessionParser(info.req, {}, () => callback(info.req.session && info.req.session.userId));
    }

    /**
     * @param {AppServerOperationResult}operationResult
     * @private
     */
    _onServerReply(operationResult) {
        const {targetSessionId, targetUserId} = operationResult;
        const clients = this._findClients(targetSessionId, targetUserId);
        const clientOperationResult = WSController.createClientOperationResult(operationResult);
        if (!_.isEmpty(clients)) {
            _.each(clients, client => this._sendClientMessage(client.ws, clientOperationResult));
        } else {
            this.logger.warn(`No web-sockets found for session:user ${targetSessionId}:${targetUserId}`);
        }
    }

    /**
     * @param {AppServerOperationResult}operationResult
     * */
    static createClientOperationResult(operationResult) {
        const operation = operationResult.operation;
        return {
            operationId: operation.getId(),
            operationType: operation.getType(),
            isOperationCompleted: operationResult.shouldCompleteOperation,
            resultType: operationResult.resultType,
            result: operationResult.result,
            error: operationResult.error
        };
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

    _onClientConnected(ws) {
        const {id:sessionId, userId} = ws.upgradeReq.session;
        this.logger.info(`WS client connected, sessionId: ${sessionId}, userId: ${userId}`);
        this.clients.push({
            ws,
            sessionId,
            userId
        });
    }

    _onClientDisconnected(clientWs) {
        this.logger.info('WS client disconnected');
        _.remove(this.clients, (client) => client.ws === clientWs);
    }

    _onClientMessage(clientWs, message) {
        this.logger.info(`Unexpected message in web-socket: ${message}`);
    }

    /**
     * @param sessionId
     * @param userId
     * @return {Array<WebSocketClient>}
     * @private
     */
    _findClients(sessionId, userId) {
        // If specified session is requested, find only client for this session.
        // Otherwise, for user id, find all sessions for the specified user.
        if (sessionId) {
            const client = _.find(this.clients, {sessionId});
            return client ? [client] : [];
        } else {
            return _.filter(this.clients, {userId})
        }
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

    /**
     * @typedef {Object}WebSocketClient
     * @property {Object}ws client web socket
     * @property {string}sessionId Session id of the specified client
     * @property {string}userId User id of the specified client
     */
}

module.exports = WSController;