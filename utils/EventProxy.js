'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

class EventProxy {
    constructor(knownEvents) {
        this.knownEvents = knownEvents;
        this.eventEmitter = new EventEmitter();
    }

    on(eventName, callback) {
        this._checkEvent(eventName);
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.removeListener(eventName, callback);
    }

    emit(eventName, data) {
        this._checkEvent(eventName);
        const haveHandlers = this.eventEmitter.emit(eventName, data);
        if (!haveHandlers) {
            console.error('No event handlers registered for the event ' + eventName);
        }
    }

    _checkEvent(eventName) {
        if (this.knownEvents
            && !_.some(this.knownEvents, event => event === eventName)) {
            throw new Error('Unexpected event: ' + eventName)
        }
    }
}

module.exports = EventProxy;

