'use strict';

/**
 * NPM script is used to import initial data, such as default samples, filters and views, if it is not imported yet.
 * */

const InitialDataImportManager = require('./utils/InitialDataImportManager');

const indexJs = require('./../../index');

const Config = indexJs.Config;
const Logger = indexJs.Logger;

const logger = new Logger(Config.logger);

const importManager = new InitialDataImportManager(Config, logger);
importManager.execute((error) => {
    if (error) {
        console.error(`Error import initial data: ${error}\n${error.stack}`);
        // Indicate failure to the caller.
        process.exit(1);
    } else {
        console.log('Done.');
        process.exit(0);
    }
});
