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

        const appServerReplyEvents = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(appServerReplyEvents.onKeepAliveResultReceived, this._onKeepAliveResultReceived.bind(this));
    }

    execute(callback) {
        async.waterfall([
            (callback) => this._destroyExpiredSessions(callback),
            (callback) => this._renewSearchSessionsOnAppServer(callback)
        ], callback);
    }

    calculateTimeout() {
        const defaultTimeoutMsecs = this.defaultTimeoutSecs * 1000;
        const lastActivityDate = this.services.sessions.getMinimumActivityTimestamp();
        const msecsBeforeNextRun = _.isNull(lastActivityDate) ?
            defaultTimeoutMsecs : (Date.now() - lastActivityDate);
        return Math.min(msecsBeforeNextRun, defaultTimeoutMsecs);
    }

    _destroyExpiredSessions(callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findExpiredSessions(callback);
            },
            (expiredSessionIds, callback) => {
                async.each(expiredSessionIds, (sessionId, callback) => {
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

    _renewSearchSessionsOnAppServer(callback) {
        const operationTypes = this.services.operations.operationTypes();
        async.waterfall([
            // Find user sessions.
            (callback) => this.services.sessions.findAll(callback),
            // Find search operations for each session.
            (sessionIds, callback) => async.map(sessionIds, (sessionId, callback) => {
                this.services.operations.findAllByType(sessionId, operationTypes.SEARCH, callback);
            }, callback),
            // Now we have arrays, each containing search operation.
            (operationsArrays, callback) => {
                const operations = _.flatten(operationsArrays);
                callback(null, operations);
            },
            // Now ask session state for each operation.
            (operations, callback) => {
                async.each(operations, (operation, callback) => {
                    const operationId = operation.getId();
                    const sessionId = operation.getSessionId();
                    this.services.applicationServer.requestKeepOperationAlive(sessionId, operationId, (error) => {
                        // Continue even if one of the requests is failed, as we need to update all the operations.
                        if (error) {
                            this.logger.error('Error updating operation state.')
                        }
                        callback(null);
                    });
                }, callback);
            }
        ], callback);
        callback(null);
    }

    _onKeepAliveResultReceived() {
        // Just to avoid error message in logs.
    }
}

module.exports = CheckSessionsTask;