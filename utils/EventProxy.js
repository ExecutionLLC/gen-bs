'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

class EventProxy {
    /**@param {(Array<string>|undefined)}knownEvents*/
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
        const haveHandlers = this.eventEmitter.emit(eventName, data);
        if (!haveHandlers) {
            console.error('No event handlers registered for the event ' + eventName);
        }
    }

    _checkEvent(eventName) {
        if (_.isEmpty(this.knownEvents) || _.includes(this.knownEvents, eventName)) {
            return;
        }
        throw new Error('Unexpected event: ' + eventName);
    }
}

module.exports = EventProxy;

