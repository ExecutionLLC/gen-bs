'use strict';

const WebSocketServer = require('ws').Server;

const WebSocketServerProxy = require('../../../utils/WebSocketServerProxy');
const RpcRouter = require('./RpcRouter');

const SearchHandler = require('./SearchHandler');

const APP_SERVER_PORT = 8030;

class MockApplicationServer {
    constructor(services) {
        Object.assign(this, {
            services,
            router: new RpcRouter(),
            webSocketServerProxy: new WebSocketServerProxy()
        });

        this._sendResultToClients = this._sendResultToClients.bind(this);
        this.onClientMessage = this.onClientMessage.bind(this);

        const searchHandler = new SearchHandler(services);

        this.router.registerHandler(searchHandler);
        this.webSocketServerProxy.onMessage(this.onClientMessage);

        this._createServer();
    }

    onClientMessage(ws, messageString) {
        try {
            const message = JSON.parse(messageString);
            this.router.handleCall(message, this._sendResultToClients);
        } catch (e) {
            console.error(`Error parsing message: ${message}`);
        }
    }

    stop() {
        this.webSocketServer.close();
    }

    static getApplicationServerPort() {
        return APP_SERVER_PORT;
    }

    static getApplicationServerHost() {
        return 'localhost';
    }

    _createServer() {
        this.webSocketServer = new WebSocketServer({port: APP_SERVER_PORT});
        this.webSocketServerProxy.addWebSocketCallbacks(this.webSocketServer);
        console.log(`App Server mock is created on port ${APP_SERVER_PORT}`);
    }

    /**
     * @param {Object}result
     * */
    _sendResultToClients(result) {
        const resultString = JSON.stringify(result);
        this.webSocketServerProxy.sendToAll(resultString);
    }
}

module.exports = MockApplicationServer;
