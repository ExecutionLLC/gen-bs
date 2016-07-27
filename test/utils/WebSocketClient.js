'use strict';

const WebSocket = require('ws');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

class WebSocketClient {
  constructor(host, port) {
    this.address = 'ws://' + host + ':' + port;

    this.wsClient = new WebSocket(this.address);

    this.wsClient.on('message', this._onWsMessage.bind(this));
    this.wsClient.on('error', this._onWsError.bind(this));
    this.wsClient.on('close', this._onWsError.bind(this));
  }

  associateSessionIdAndUserId(sessionId, userId) {
    const message = {
      sessionId,
      userId
    };
    this.wsClient.send(JSON.stringify(message));
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
    // console.log('WS Message: ' + message);
    const parsedMessage = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(message));
    if (this.messageCallback) {
      this.messageCallback(parsedMessage);
    }
  }

  _onWsError(error) {
    // console.error('WS Error: ' + error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}

module.exports = WebSocketClient;
