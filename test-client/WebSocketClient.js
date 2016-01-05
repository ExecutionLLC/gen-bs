'use strict';

const Request = require('request');
const WebSocket = require('ws');

class WebSocketClient {
  constructor(host, port) {
    this.address = 'ws://' + host + ':' + port;


    this.wsClient = new WebSocket(this.address);

    this.wsClient.on('message', this._onWsMessage.bind(this));
    this.wsClient.on('error', this._onWsError.bind(this));
    this.wsClient.on('close', this._onWsError.bind(this));
  }

  _onWsMessage(message, flags) {
    console.log('WS Message: ' + JSON.stringify(message, null, 2));
    console.log('WS Message Flags: ' + JSON.stringify(flags, null, 2));
  }

  _onWsError(error) {
    console.error('WS Error: ' + JSON.stringify(error, null, 2));
  }
}

module.exports = WebSocketClient;
