'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');

const DatabaseCreator = require('./utils/DatabaseCreator');
const InitialDataImportManager = require('./utils/InitialDataImportManager');
const {doUpdate} = require('../defaults/update-fields-labels');
const indexJs = require('./../../index');
const Config = indexJs.Config;
const Logger = indexJs.Logger;

const logger = new Logger(Config.logger);

const DatabaseSettings = Config.database;

const databaseCreator = new DatabaseCreator(
    DatabaseSettings.host,
    DatabaseSettings.port,
    DatabaseSettings.user,
    DatabaseSettings.password,
    DatabaseSettings.databaseName
);

databaseCreator.create(true)
    .then((wasExist) => {
        console.log('Database presence done, ' + (wasExist ? 'already exists' : 'created') + '.');
        if (wasExist) {
            process.exit(0);
        }
        const importManager = new InitialDataImportManager(Config, logger);
        importManager.execute((error) => {
            if (error) {
                console.error(`Error import initial data: ${error}\n${error.stack}`);
                // Indicate failure to the caller.
                process.exit(1);
            } else {
                console.log('Importing done.');
                doUpdate((error, context) => {
                    if (error) {
                        console.error(`Failed to update labels: ${error}`);
                        context.trx.rollback()
                            .then(() => {
                                console.log('Rollback successful');
                                process.exit(1);
                            })
                            .catch((error) => {
                                console.log(`Rollback failed: ${error}`);
                                process.exit(1);
                            });
                    } else {
                        console.log('Labels are successfully updated.');
                        process.exit(0);
                    }
                });
            }
        });
    })
    .catch((error) => {
        console.error(error);
        // Indicate failure to the caller.
        process.exit(1);
    });
