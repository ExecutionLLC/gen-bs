'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'checkSessions';

class CheckSessionsTask extends SchedulerTaskBase {
    constructor(services, models) {
        const isEnabled = services.config.scheduler.tasks[TASK_NAME].isEnabled;
        const taskTimeout = services.config.scheduler.tasks[TASK_NAME].taskTimeout;
        super(TASK_NAME, isEnabled, taskTimeout, services, models);
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
        const defaultTimeoutMsecs = this.defaultTimeoutSecs * 1000;
        const lastActivityDate = this.services.sessions.getMinimumActivityTimestamp();
        const msecsBeforeNextRun = _.isNull(lastActivityDate) ?
            defaultTimeoutMsecs : (Date.now() - lastActivityDate);
        return Math.min(msecsBeforeNextRun, defaultTimeoutMsecs);
    }
}

module.export