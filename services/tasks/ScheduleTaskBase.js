'use strict';

class ScheduleTaskBase {
    constructor(name, timeout, services, models) {
        this.services = services;
        this.models = models;

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.name = name;
        this.timeout = timeout;
        this.enabled = true;

        this.timeoutId = null;

        this.execute = this.execute.bind(this);
    }

    enable() {
        this.logger.info('Task enabled: ' + this.name);
        this.enabled = true;
    }

    disable() {
        this.stop();
        this.enabled = false;
        this.logger.info('Task disabled: ' + this.name);
    }

    stop() {
        clearTimeout(this.timeoutId);
        this.logger.info('Task stopped: ' + this.name);
    }

    // Execute task stub
    execute(callback) {
        callback(new Error('Cannot run base task execute method stub.'));
    }

    calculateTimeout() {
        return this.timeout;
    }
}

module.exports = ScheduleTaskBase;