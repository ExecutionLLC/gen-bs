'use strict';

const _ = require('lodash');

const InitialDataImportManager = require('./InitialDataImportManager');

class StartupTaskManager {
    constructor(services, models, config, logger) {
        this.services = services;
        this.models = models;
        this.config = config;
        this.logger = logger;

        this.importManager = new InitialDataImportManager(models, config, logger);
    }

    execute() {
        this.importManager.execute();
    }
}

module.exports = StartupTaskManager;
