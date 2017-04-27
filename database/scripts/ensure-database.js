'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');

const DatabaseCreator = require('./utils/DatabaseCreator');
const Config = require('../../utils/Config');

const DatabaseSettings = Config.database;

const databaseCreator = new DatabaseCreator(
    DatabaseSettings.host,
    DatabaseSettings.port,
    DatabaseSettings.user,
    DatabaseSettings.password,
    DatabaseSettings.databaseName
);

databaseCreator.create(true)
    .then((result) => {
        console.log('Done, ' + (result ? 'already exists' : 'created') + '.');
        process.exit(0);
    }).catch((error) => {
    console.error(error);
    // Indicate failure to the caller.
    process.exit(1);
});
