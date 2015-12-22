'use strict';

const Express = require('express');
const Http = require('http');
const WebSocketServer = require('ws').Server;

const ControllerBase = require('./ControllerBase');

class WSController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    createRouter() {
        // Start web socket server.
        const httpServer = Http.createServer();
        const webSocketServer = new WebSocketServer({
            server: httpServer
        });
        webSocketServer.on('connection', (ws) => {
            ws.on('message', (message) => {
                console.log('WS: Received ' + message);
                ws.send(message);
            });
        });

        const router = new Express();

        router.ws('/echo', (ws, request) => {
            ws.on('message', (message) => {
                console.log(message);
                ws.send(message);
            })
        });

        return router;
    }
}

module.exports = WSController;