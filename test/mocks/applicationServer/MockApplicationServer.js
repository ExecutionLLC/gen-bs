'use strict';

const WebSocketServerProxy = require('../../../utils/WebSocketServerProxy');
const RpcRouter = require('./RpcRouter');

const searchHandler = require('./SearchHandler');

class MockApplicationServer {
    constructor(router) {
        this.router = router;

        this.webSocketServer = new WebSocketServerProxy();
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

const rpcRouter = new RpcRouter();
rpcRouter.registerHandler(searchHandler);

const mockAppServer = new MockApplicationServer(rpcRouter);
module.exports = mockAppServer;
