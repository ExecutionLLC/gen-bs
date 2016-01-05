'use strict';

const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

const EventEmitter = require('events').EventEmitter;

const EVENTS = {
    operationProgress: 'operationProgress'
};

class WSService extends ServiceBase {
    constructor(services) {
        super(services);

        this.eventEmitter = new EventEmitter();
        this._registerAppServerEvents();
    }

    registeredEvents() {
        return EVENTS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.removeListener(eventName, callback);
    }

    _registerAppServerEvents() {
        const appServer = this.services.applicationServer;
        const AppServerEvents = appServer.registeredEvents();

    }

}

module.exports = WSService;