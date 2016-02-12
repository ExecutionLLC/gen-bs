'use strict';

class SheduleTaskBase {
    constructor(name, interval, services, models) {
        this.services = services;
        this.models = models;

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.name = name;
        this.interval = interval;

        this.startDate = Date.now();
        this.nextExecDate = null;
        this.running = false;

        this.setNextExecDate();
    }

    setExecDate(date) {
        this.nextExecDate = date;
        return this.nextExecDate;
    }

    setNextExecDate() {
        return this.setExecDate(Date.now() + this.interval * 1000);
    }
}

module.exports = SheduleTaskBase;