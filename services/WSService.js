'use strict';

const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

class WSService extends ServiceBase {
    constructor(services) {
        super(services);

    }

    registerCallbacks() {
        let appServer = this.services.applicationServer;
        appServer.registerCallback('v1.get_session_state', this.services.sessionService.updateOperation);
    }

}

module.exports = WSService;