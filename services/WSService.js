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

    _onSearchReply(reply) {
        const sessionStatuses = this.services.applicationServerReply.sessionStatuses();
        if (reply.status !== sessionStatuses.READY) {
            this.eventEmitter.emit(EVENTS.operationProgress, reply);
        } else {
            const redisDb = reply.redisDb;
            this.services.redis.fetch(redisDb.host, redisDb.port, redisDb.databaseNumber,
                redisDb.dataIndex, reply.offset, reply.total, (error, data) => {
                    // Send data to client
                    this.eventEmitter.emit(EVENTS.searchResults, data);
                });
        }
    }

    _registerAppServerEvents() {
        const appServerReply = this.services.applicationServerReply;
        const events = appServerReply.registeredEvents();

        appServerReply.on(events.openSearchSession, this._onSearchReply.bind(this));
    }

}

module.exports = WSService;
