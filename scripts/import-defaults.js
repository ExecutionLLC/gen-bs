'use strict';

/**
 * NPM script is used to import initial data, such as default samples, filters and views, if it is not imported yet.
 * */

const InitialDataImportManager = require('../startup/InitialDataImportManager');
const Config = require('../utils/Config');

const importManager = new InitialDataImportManager();
