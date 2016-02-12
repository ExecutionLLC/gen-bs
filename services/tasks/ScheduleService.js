'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('../ServiceBase');

const CheckSessionsTask = require('./CheckSessionsTask');

class ScheduleService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.checkSessionTask = new CheckSessionsTask(services, models);

        this.tasks = [
            this.checkSessionTask
        ];

        this.pid = 0;
    }

    start(interval) {
        this.pid = setInterval(() => {
            _.each(this.tasks, (task) => {
                this.checkScheduleTask(task, (error, result) => {
                    if (error) {
                        this.logger.error("Task: " + task.name + ' ' + error);
                    } else {
                        this.logger.info("Task: " + task.name + ' ' + JSON.stringify(result, null, 2));
                    }
                });
            });
        }, interval * 1000);
    }

    stop() {
        clearInterval(this.pid);
    }

    checkScheduleTask(task, callback) {
        async.waterfall([
            (callback) => {
                callback(null, task.nextExecDate);
            },
            (nextExecDate, callback) => {
                if (task.running) {
                    return callback(null, {schedule: 'running'});
                }

                const currentDate = new Date();
                if (currentDate < nextExecDate) {
                    return callback(null, {schedule: 'idle'});
                }

                async.waterfall([
                    (callback) => {
                        task.exec(callback);
                    },
                    (result, callback) => {
                        result.schedule = 'completed';
                        if (result.nextExecDate) {
                            task.setExecDate(result.nextExecDate);
                        } else {
                            task.setNextExecDate();
                        }
                        callback(null, result);
                    }
                ], callback);
            }
        ], callback);
    }
}

module.exports = ScheduleService;