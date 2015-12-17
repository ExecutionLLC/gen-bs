'use strict';

var WebSocketServer = require('ws').Server;

class RPCServer {
    constructor() {
        var self = this;
        const port = 5050;
        self.listenWs(port);
    }

    listenWs(port) {
        var self = this;
        this.clients = [];

        this.wsServer = new WebSocketServer({port: port});
        console.log('Start listening Websockets on port ' + port);

        this.wsServer.on('connection', function(ws) {
            self.clients.push(ws);
            console.log('New client connected to server; Current count: ' + self.clients.length);

            ws.reply = function(msg) {
                if (msg) {
                    console.log('Message replied: ' + JSON.stringify(msg));
                    ws.send(JSON.stringify(msg));
                }
            };

            ws.on('message', function(message) {
                ws.reply(self.handleServerMessage(JSON.parse(message)));
            });

            ws.on('close', function() {
                self.clients.splice(self.clients.indexOf(ws), 1);
                console.log('Client disconnected from server; Current count: ' + self.clients.length);
            });
        });
    }

    handleServerMessage(message) {
        console.log('Message handled: ' + JSON.stringify(message));
        //return {id: message.id, error: null, result: {method: message.method, data: {params: message.params}}}
        return message;

    }
}

var rpcServer = new RPCServer();

module.exports = RPCServer;