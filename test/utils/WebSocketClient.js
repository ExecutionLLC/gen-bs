'use strict';

const WebSocket = require('ws');

class WebSocketClient {
  constructor(host, port) {
    this.address = 'ws://' + host + ':' + port;

    this.wsClient = new WebSocket(this.address);

    this.wsClient.on('message', this._onWsMessage.bind(this));
    this.wsClient.on('error', this._onWsError.bind(this));
    this.wsClient.on('close', this._onWsError.bind(this));
  }

  send(data) {
    this.wsClient.send(JSON.stringify(data));
  }

  onMessage(callback) {
    this.messageCallback = callback;
  }

  onError(callback) {
    this.errorCallback = callback;
  }

  _onWsMessage(message, flags) {
    console.log('WS Message: ' + JSON.stringify(message, null, 2));
    if (this.errorCallback) {
      this.errorCallback(message);
    }
  }

  _onWsError(error) {
    console.error('WS Error: ' + JSON.stringify(error, null, 2));
    if (this.messageCallback) {
      this.messageCallback(error);
    }
  }
}

module.exports = WebSocketClient;
