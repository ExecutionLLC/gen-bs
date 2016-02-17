'use strict';

const _ = require('lodash');

const ServiceBase = require('../ServiceBase');

const CheckSessionsTask = require('./CheckSessionsTask');
const ImportSourceMetadataTask = require('./ImportSourceMetadataTask');

class SchedulerService extends ServiceBase {
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

        this.executeTask = this.executeTask.bind(this);
    }

    start() {
        if (!this.config.scheduler.enabled) {
            logger.warn('Cannot start schedule tasks: scheduler is disabled.');
            return;
        }

        this.logger.info('Scheduler service is started.');

        const activeTasks = this._getActiveTasks();
        _.each(activeTasks, (task) => {
            this.executeTask(task);
        });
    }

    executeTask(task) {
        if (!task.enabled) {
            this.logger.warn('Cannot process disabled task: ' + task.name);
        } else {
            this.logger.info('Processing task: ' + task.name + '...');
            task.execute((error) => {
                if (error) {
                    this.logger.error('Task ' + task.name + ' error: ' + error);
                } else {
                    this.logger.info('Task ' + task.name + ' processed.');
                }
                task.timeoutId = setTimeout(this.executeTask, task.calculateTimeout(), task);
            });
        }

    }

    stopTask(task) {
        task.stop();
    }

    stop() {
        _.each(this.tasks, (task) => {
            this.stopTask(task);
        });
        this.logger.info('Scheduler service is stopped.');
    }

    findTask(taskName) {
        return _.find(this.tasks, (task) => {
            return task.name === taskName;
        });
    }

    _getActiveTasks() {
        return _.filter(this.tasks, (task) => {
            return task.enabled;
        });
    }
}

module.exports = SchedulerService;