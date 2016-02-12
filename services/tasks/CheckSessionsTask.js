'use strict';

const _ = require('lodash');
const async = require('async');

const ScheduleTaskBase = require('./ScheduleTaskBase');

const TASK_NAME = 'CheckSessions';
const TASK_INTERVAL = 30;

class CheckSessionsTask extends ScheduleTaskBase {
    constructor(services, models) {
        super(TASK_NAME, TASK_INTERVAL, services, models);
    }

    exec(callback) {
        this.running = true;

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
            },
            (sessionIds, callback) => {
                const taskOutput = {
                    result: {
                        sessions: sessionIds
                    },
                    nextExecDate: _.min([this.services.sessions.getMinimumActivityDate(), Date.now() + this.interval * 1000])
                };
                callback(null, taskOutput);
            }
        ], (error, result) => {
            this.running = false;
            callback(error, result);
        });

    }
}

module.exports = CheckSessionsTask;