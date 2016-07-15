'use strict';

const _ = require('lodash');

const SearchOperation = require('../operations/SearchOperation');
const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'checkSessions';

class CheckSessionsTask extends SchedulerTaskBase {
    constructor(services, models) {
        const isEnabled = services.config.scheduler.tasks[TASK_NAME].isEnabled;
        const taskTimeout = services.config.scheduler.tasks[TASK_NAME].taskTimeout;
        super(TASK_NAME, isEnabled, taskTimeout, services, models);

        const appServerReplyEvents = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(appServerReplyEvents.onKeepAliveResultReceived, this._onKeepAliveResultReceived.bind(this));
    }

    execute(callback) {
        this._renewSearchSessionsOnAppServer(callback);
    }

    _renewSearchSessionsOnAppServer(callback) {
        // TODO: Remove or fix.
        callback(null);
    }

    _onKeepAliveResultReceived() {
        // Just to avoid error message in logs.
    }
}

module.exports = CheckSessionsTask;