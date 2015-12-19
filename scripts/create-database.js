'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');

const DatabaseCreator = require('../startup/DatabaseCreator');
const ConfigWrapper = require('../utils/ConfigWrapper');

const DatabaseSettings = ConfigWrapper.database;

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
