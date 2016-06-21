'use strict';

const WebSocketServerProxy = require('../../../utils/WebSocketServerProxy');
const RpcRouter = require('./RpcRouter');

const SearchHandler = require('./SearchHandler');

class MockApplicationServer {
    constructor(services) {
        Object.assign(this, {
            services,
            router: new RpcRouter(),
            webSocketServer: new WebSocketServerProxy()
        });

        const searchHandler = new SearchHandler(services);

        this.router.registerHandler(searchHandler);
        this.webSocketServer.onMessage(this.onClientMessage.bind(this));
    }

    addWebSocketCallbacks(webSocketServer) {
        this.webSocketServer.addWebSocketCallbacks(webSocketServer);
    }

    onClientMessage(ws, messageString) {
        try {
            const message = JSON.parse(messageString);
            this.router.handleCall(message);
        } catch (e) {
            console.error(`Error parsing message: ${message}`);
        }
    }
}

module.exports = MockApplicationServer;
