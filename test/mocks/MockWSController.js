'use strict';

const _ = require('lodash');

const WSController = require('../../controllers/WSController');

class MockWSController extends WSController {
    constructor(services) {
        super(services);
    }

    _onClientConnected(ws) {
        this.clients.push({ws});
    }

    _onClientMessage(clientWS, message) {
        const clientDescriptor = _.find(this.clients, {ws: clientWS});
        if (!clientDescriptor) {
            return;
        }
        const {sessionId, userId} = JSON.parse(message);
        Object.assign(clientDescriptor, {sessionId, userId});
    }

    verifyWebSocketClient(info, callback) {
        callback(true);
    }
}

module.exports = MockWSController;
