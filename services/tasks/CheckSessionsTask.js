'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'CheckSessions';
const TASK_TIMEOUT = 30; // Task timeout, in seconds

class CheckSessionsTask extends SchedulerTaskBase {
    constructor(services, models) {
        super(TASK_NAME, true, TASK_TIMEOUT, services, models);
    }

    execute(callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findExpiredSessions(callback);
            },
            (expiredSessionIds, callback) => {
                async.map(expiredSessionIds, (sessionId, callback) => {
                    this.services.sessions.destroySession(sessionId, (error) => {
                        if (error) {
                            this.logger.error('Error destroying existing session: %s', error);
                        } else {
                            this.logger.info('Session is destroyed by timeout: ' + sessionId);
                        }
                        callback(null, sessionId);
                    });
                }, callback);
            }
        ], callback);
    }

    calculateTimeout() {
        const defaultTimeoutSecs = this.defaultTimeoutSecs;
        const lastActivityDate = this.services.sessions.getMinimumActivityTimestamp();
        const msecsBeforeNextRun = _.isNull(lastActivityDate) ?
            defaultTimeoutSecs * 1000 : (Date.now() - lastActivityDate);
        return Math.min(msecsBeforeNextRun, defaultTimeoutSecs);
    }
}

module.exports = CheckSessionsTask;