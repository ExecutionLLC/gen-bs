'use strict';

const _ = require('lodash');

const ServiceBase = require('../ServiceBase');
const ErrorUtils = require('../../utils/ErrorUtils');

const ImportSourceMetadataTask = require('./ImportSourceMetadataTask');

class SchedulerService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.importSourceMetadataTask = new ImportSourceMetadataTask(services, models);

        this.tasks = [
            this.importSourceMetadataTask
        ];

        this._executeTask = this._executeTask.bind(this);
    }

    start(callback) {
        if (!this.config.scheduler.enabled) {
            this.logger.error('Scheduler is disabled in config.');
            return;
        }

        this.logger.debug('Scheduler service is started.');

        const activeTasks = this._getEnabledTasks();
        _.each(activeTasks, (task) => {
            this._executeTask(task);
        });
        callback(null);
    }

    _executeTask(task) {
        if (!task.isEnabled) {
            this.logger.warn('Task ' + task.name + ' is disabled, do nothing.');
        } else {
            this.logger.debug('Processing task: ' + task.name + '...');
            task.execute((error) => {
                if (error) {
                    const message = ErrorUtils.createErrorMessage(error);
                    this.logger.error('Task ' + task.name + ': ' + message);
                } else {
                    this.logger.debug('Task ' + task.name + ' processed.');
                }
                task.timeoutId = setTimeout(this._executeTask, task.calculateTimeout(), task);
            });
        }
    }

    stop() {
        _.each(this.tasks, (task) => {
            this._stopTask(task);
        });
        this.logger.info('Scheduler service is stopped.');
    }

    _stopTask(task) {
        if (task.timeoutId) {
            clearTimeout(task.timeoutId);
        }
    }

    _getEnabledTasks() {
        return _.filter(this.tasks, (task) => task.isEnabled);
    }
}

module.exports = SchedulerService;