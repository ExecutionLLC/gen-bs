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
    }

    start() {
        if (!this.config.schedule.enabled) {
            return;
        }

        _.each(this.tasks, (task) => {
            task.start();
        });
    }

    stop() {
        _.each(this.tasks, (task) => {
            task.stop();
        });
    }
}

module.exports = ScheduleService;