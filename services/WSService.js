'use strict';

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');

const EVENTS = {
    operationProgress: 'operationProgress',
    searchResults: 'searchResults'
};

class WSService extends ServiceBase {
    constructor(services) {
        super(services);

        this.eventEmitter = new EventProxy();
        this._registerAppServerEvents();
    }

    registeredEvents() {
        return EVENTS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }

    _onSearchReply(reply, callback) {
        const sessionStatuses = this.services.applicationServerReply.sessionStatuses();
        if (reply.status !== sessionStatuses.READY) {
            this.eventEmitter.emit(EVENTS.operationProgress, reply);
        } else {
            // TODO: Get data from redis here.
            this.eventEmitter.emit(EVENTS.searchResults, {
                'TODO': 'The data is ready but we cannot extract it'
            });
        }
        callback(null);
    }

    _registerAppServerEvents() {
        const appServerReply = this.services.applicationServerReply;
        const events = appServerReply.registeredEvents();

        appServerReply.on(events.openSearchSession, this._onSearchReply.bind(this));
    }

}

module.exports = WSService;