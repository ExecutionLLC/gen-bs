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
        const result = reply.result;
        if (reply.error || result.status !== sessionStatuses.READY) {
            this.eventEmitter.emit(EVENTS.operationProgress, reply);
        } else {
            const redisDb = result.redisDb;
            this.services.redis.fetch(redisDb.host, redisDb.port, redisDb.databaseNumber,
                redisDb.dataIndex, result.offset, result.limit, (error, data) => {
                    if (error) {
                        console.error(error);
                    } else {
                        // Send data to client
                        this.eventEmitter.emit(EVENTS.searchResults, data);
                    }
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
