class WebSocketClient {
    constructor(host, port) {
        this.address = 'ws://' + host + ':' + port;

        this.wsClient = new WebSocket(this.address);

        this.wsClient.onmessage = event => console.log('WS Message: ' + JSON.stringify(event.data));
        this.wsClient.onerror = (event) => console.log('WS Message(error): ' + JSON.stringify(event.data));
        this.wsClient.onclose = (event) => console.log('WS Message(close): ' + JSON.stringify(event.data));

    }

    send(data) {
        this.wsClient.send(JSON.stringify(data));
    }

}

module.exports = WebSocketClient;
