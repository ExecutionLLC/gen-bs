'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');

const DatabaseCreator = require('./../startup/DatabaseCreator');

// TODO: Load values from the config file.
const SERVER_HOST = process.env.GMX_DATABASE_SERVER || '172.17.0.2';
const USER_NAME = process.env.GMX_DATABASE_USER || 'postgres';
const PASSWORD = process.env.GMX_DATABASE_PASSWORD || 'zxcasdqwe';
const DATABASE_NAME = process.env.GMX_DATABASE_NAME || 'genomixdb';

const databaseCreator = new DatabaseCreator(SERVER_HOST, USER_NAME, PASSWORD, DATABASE_NAME);

databaseCreator.create()
.then(() => {
    console.log('Success.');
}).catch(error => {
    console.error('Error creating database: ' + error);
    // Indicate failure to the caller.
    process.exit(1);
});
