'use strict';

const _ = require('lodash');
const async = require('async');

const ScheduleTaskBase = require('./ScheduleTaskBase');

const TASK_NAME = 'CheckSessions';
const TASK_TIMEOUT = 30; // Task timeout, in seconds

class CheckSessionsTask extends ScheduleTaskBase {
    constructor(services, models) {
        super(TASK_NAME, TASK_TIMEOUT, services, models);
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
                            this.logger.info('Existing session is destroyed: ' + sessionId);
                        }
                        callback(null, sessionId);
                    });
                }, callback);
            }
        ], callback);
    }

    calculateTimeout() {
        const defaultTimeout = this.timeout * 1000;
        const lastActivityDate = this.services.sessions.getMinimumActivityDate();

        let timeout = Date.now();
        if (_.isNull(lastActivityDate)) {
            timeout = defaultTimeout;
        } else {
            timeout = timeout - lastActivityDate;
            if (timeout < 0) {
                timeout = defaultTimeout;
            }
        }
        return Math.min(timeout, defaultTimeout);
    }
}

module.exports = CheckSessionsTask;