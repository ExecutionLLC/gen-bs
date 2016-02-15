'use strict';

const _ = require('lodash');

const ServiceBase = require('../ServiceBase');

const CheckSessionsTask = require('./CheckSessionsTask');
const ImportSourceMetadataTask = require('./ImportSourceMetadataTask');

class ScheduleService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.checkSessionTask = new CheckSessionsTask(services, models);
        this.importSourceMetadataTask = new ImportSourceMetadataTask(services, models);

        this.tasks = [
            this.checkSessionTask,
            this.importSourceMetadataTask
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