'use strict';

/**
 * NPM script used to create database, if it doesn't exist.
 * */

const _ = require('lodash');
const Knex = require('knex');
const Promise = require('bluebird');

const Config = require('../../Config');

const DatabaseSettings = Config.database;


class DatabaseCreator {
    constructor(serverHost, serverPort, userName, password, databaseName) {
        this.serverHost = serverHost;
        this.serverPort = serverPort;
        this.userName = userName;
        this.password = password;
        this.databaseName = databaseName;
    }

    create() {
        const postgresConfig = this._createKnexConfigForDatabaseName('postgres');

        const postgresKnex = new Knex(postgresConfig);

        return new Promise((resolve, reject) => {
            this._isDatabaseExists(postgresKnex)
                .then(isDatabaseExists => {
                    if (isDatabaseExists) {
                        return this._dropDatabaseIfExists(postgresKnex)
                            .catch((dropError) => {
                                return Promise.reject('Failed to drop database. ' + dropError);
                            })
                            .then(() => {
                                console.log('Database dropped: ' + this.databaseName + '.');
                                return this._createDatabase(postgresKnex)
                                    .catch((error) => {
                                        return Promise.reject('Failed to create database. ' + error);
                                    });
                            });
                    } else {
                        return this._createDatabase(postgresKnex)
                            .catch((error) => {
                                return Promise.reject('Failed to create database. ' + error);
                            })
                    }
                })
                .then(() => {
                    console.log('Database created: ' + this.databaseName + '.');
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
                .finally(() => {
                    console.log('Destroying postgres database context...');
                    postgresKnex.destroy();
                });
        });
    }

    _createDatabase(postgresKnex) {
        console.log('Creating database ' + this.databaseName + '...');
        return this._createEmptyDatabase(postgresKnex)
            .then(() => {
                console.log('Connecting to database...');
                const databaseConfig = this._createKnexConfigForDatabaseName(this.databaseName);
                const databaseKnex = new Knex(databaseConfig);

                return this._createTables(databaseKnex)
                    .finally(() => {
                        console.log('Destroying ' + this.databaseName + ' database context...');
                        databaseKnex.destroy();
                    });
            });
    }

    _createTables(databaseKnex) {
        return Promise.resolve();
    }

    _createEmptyDatabase(postgresKnex) {
        return postgresKnex.raw(`CREATE DATABASE ${this.databaseName}`);
    }

    _dropDatabaseIfExists(postgresKnex) {
        console.log(`Dropping database ${this.databaseName}...`);
        // Terminate active database connections
        return postgresKnex.raw(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${this.databaseName}'`)
            .then(() => {
                // Drop database if exists
                return postgresKnex.raw(`DROP DATABASE IF EXISTS ${this.databaseName}`);
            });
    }

    /**
     * Returns promise with check result.
     * */
    _isDatabaseExists(postgresKnex) {
        return postgresKnex('pg_database')
            .select()
            .where({
                datname: this.databaseName
            })
            .then((databases) => {
                return databases.length > 0;
            });
    }

    _createKnexConfigForDatabaseName(databaseName) {
        return {
            client: 'pg',
            connection: {
                host: this.serverHost,
                port: this.serverPort,
                user: this.userName,
                password: this.password,
                database: databaseName
            }
        };
    }
}


const databaseCreator = new DatabaseCreator(DatabaseSettings.host, DatabaseSettings.port,
    DatabaseSettings.user, DatabaseSettings.password, DatabaseSettings.databaseName);

databaseCreator.create()
.then(() => {
    console.log('Done.');
    process.exit(0);
}).catch((error) => {
    console.error(error);
    // Indicate failure to the caller.
    process.exit(1);
});
