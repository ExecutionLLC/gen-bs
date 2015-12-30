'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');

const DatabaseCreator = require('../startup/DatabaseCreator');
const Config = require('../utils/Config');

const DatabaseSettings = Config.database;

const databaseCreator = new DatabaseCreator(DatabaseSettings.host,
    DatabaseSettings.user, DatabaseSettings.password, DatabaseSettings.databaseName);

databaseCreator.create()
.then(() => {
    console.log('Success.');
}).catch(error => {
    console.error('Error creating database: ' + error);
    // Indicate failure to the caller.
    process.exit(1);
});
