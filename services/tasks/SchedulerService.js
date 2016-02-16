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

        this.checkSessionsTask = new CheckSessionsTask(services, models);
        this.importSourceMetadataTask = new ImportSourceMetadataTask(services, models);

        this.tasks = [
            this.checkSessionsTask,
            this.importSourceMetadataTask
        ];

        this._executeTask = this._executeTask.bind(this);
    }

    start() {
        if (!this.config.scheduler.enabled) {
            this.logger.error('Scheduler is disabled in config.');
            return;
        }

        this.logger.info('Schedule service is started.');

        const activeTasks = this._getActiveTasks();
        _.each(activeTasks, (task) => {
            this._executeTask(task);
        });
    }

    _executeTask(task) {
        if (!task.enabled) {
            this.logger.warn('Task ' + task.name + ' is disabled, do nothing.');
        } else {
            this.logger.info('Processing task: ' + task.name + '...');
            task.execute((error) => {
                if (error) {
                    this.logger.error('Task ' + task.name + ' error: ' + error);
                } else {
                    this.logger.info('Task ' + task.name + ' processed.');
                }
                task.timeoutId = setTimeout(this._executeTask, task.calculateTimeout(), task);
            });
        }
    }

    _stopTask(task) {
        if (task.timeoutId) {
            clearTimeout(task.timeoutId);
        }
        task.stop();
    }

    stop() {
        _.each(this.tasks, (task) => {
            this._stopTask(task);
        });
        this.logger.info('Schedule service is stopped.');
    }

    _getActiveTasks() {
        return _.filter(this.tasks, (task) => {
            return task.enabled;
        });
    }
}

module.exports = SchedulerService;