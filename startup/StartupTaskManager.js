'use strict';

const _ = require('lodash');

const InitialDataImportManager = require('./InitialDataImportManager');

class StartupTaskManager {
    constructor(services, models) {
        this.services = services;
        this.models = models;

        this.importManager = new InitialDataImportManager(services, models);
    }

    execute() {
        this.importManager.execute();
    }
}

module.exports = StartupTaskManager;
