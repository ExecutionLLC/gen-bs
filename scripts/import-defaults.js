'use strict';

/**
 * NPM script is used to import initial data, such as default samples, filters and views, if it is not imported yet.
 * */

const InitialDataImportManager = require('../startup/InitialDataImportManager');

const ModelsFacade = require('../models/ModelsFacade');

const Config = require('../utils/Config');
const Logger = require('../utils/Logger');

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);

const importManager = new InitialDataImportManager(models, Config, logger);
importManager.execute((error) => {
    if (error) {
        console.error('Error import initial data: ' + error);
        // Indicate failure to the caller.
        process.exit(1);
    } else {
        console.log('Done.');
        process.exit(0);
    }
});
