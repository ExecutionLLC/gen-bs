'use strict';

class SchedulerTaskBase {
    constructor(name, isEnabled, defaultTimeoutSecs, services, models) {
        this.services = services;
        this.models = models;

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.name = name;
        this.defaultTimeoutSecs = defaultTimeoutSecs;
        this.isEnabled = isEnabled;

        this.timeoutId = null;

        this.execute = this.execute.bind(this);
    }

    enable() {
        this.logger.info('Task marked as enabled: ' + this.name);
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.logger.info('Task marked as disabled: ' + this.name);
    }

    // Execute task stub
    execute(callback) {
        callback(new Error('Cannot run base task execute method stub.'));
    }

    calculateTimeout() {
        return this.defaultTimeoutSecs;
    }
}

module.exports = SchedulerTaskBase;