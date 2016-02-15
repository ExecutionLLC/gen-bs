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

        this.pID = null;
    }

    enable() {
        this.logger.info("Task enabled: " + this.name);
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        this.logger.info("Task disabled: " + this.name);
    }

    start() {
        if (this.enabled) {
            this.logger.info("Task started: " + this.name);
            this.pID = setTimeout(this.execute, this.timeout * 1000);
        }
    }

    stop() {
        clearTimeout(this.pID);
        this.logger.info("Task stopped: " + this.name);
    }

    // Execute task stub
    execute() {
    }
}

module.exports = ScheduleTaskBase;