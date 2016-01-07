'use strict';

const EventEmitter = require('events').EventEmitter;

class EventProxy {
    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.removeListener(eventName, callback);
    }

    emit(eventName, data) {
        const haveHandlers = this.eventEmitter.emit(eventName, data);
        if (!haveHandlers) {
            console.error('No event handlers registered for the event ' + eventName);
        }
    }
}

module.exports = EventProxy;

