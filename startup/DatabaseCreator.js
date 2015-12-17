'use strict';

const Knex = require('knex');

/**
 * Database creation manager.
 *
 * <remarks>Any method in this class is expected
 * to return bluebird Promise, which is internally
 * used in knexjs.</remarks>
 * */
class DatabaseCreator {
    constructor(serverHost, userName, password, databaseName) {
        this.serverHost = serverHost;
        this.userName = userName;
        this.password = password;
        this.databaseName = databaseName;
    }

    process() {
        const postgresConfig = this._createKnexConfigForDatabaseName('postgres');

        const postgesKnex = new Knex(postgresConfig);

        return this._isDatabaseExists(postgesKnex)
        .then(isDatabaseExists => {
            if (!isDatabaseExists) {
                return this._createEmptyDatabase(postgesKnex)
                .then(() => {
                    console.log('Destroying Knex instance...')
                    // Destroy instance, we don't need it anymore.
                    postgesKnex.destroy();

                    console.log('Connecting to database...');
                    const databaseConfig = this._createKnexConfigForDatabaseName(this.databaseName);
                    const databaseKnex = new Knex(databaseConfig);

                    return this._createTables(databaseKnex);
                });
            } else {
                console.log('Database is found.');
                return true;
            }
        }).catch(error => {
            console.error('Error creating database: ' + error);
        });
    }

    _createTables(databaseKnex) {
        return databaseKnex.schema

            // Language
            .createTable('langu', (table) => {
                table.uuid('id');
                table.string('description', 20);
            })

            // Users
            .createTable('users', (table) => {
                table.uuid('id');
                table.string('email', 50);
                table.integer('number_paid_samples');
            })

            .createTable('user_text', table => {
                table.uuid('user_id');
                table.string('name', 50);
                table.string('last_name', 50);
                table.string('speciality', 50);
            })



            .then(() => {
                console.log('Tables created successfully.')
            })

            .catch((error) => {
                console.log('Error creating tables: ' + error);
            })
        ;
    }

    _createEmptyDatabase(postgresKnex) {
        // Create database
        console.log('Creating database ' + this.databaseName);
        return postgresKnex.raw('CREATE DATABASE ' + this.databaseName)
            .then(() => {
                console.log('Connecting to database...');

                // Recreate knex with different config.
                knex.destroy();
                knexConfig.connection.database = DATABASE_NAME;

                return new Knex(knexConfig);
            }).then((knex) => {
                console.log('Creating tables...');

                return knex.schema

                    // Language
                    .createTable('langu', (table) => {
                        table.uuid('id');
                        table.string('description', 20);
                    })

                    // Users
                    .createTable('users', (table) => {
                        table.uuid('id');
                        table.string('email', 50);
                        table.integer('number_paid_samples');
                    })

                    .createTable('user_text', table => {
                        table.uuid('user_id');
                        table.string('name', 50);
                        table.string('last_name', 50);
                        table.string('speciality', 50);
                    })

                    .then(() => {
                        console.log('Tables should be created.')
                    });
            })
            .catch((error) => {
                console.error('Error creating database: ' + error);
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
                user: this.userName,
                password: this.password,
                database: databaseName
            }
        };
    }
}

module.exports = DatabaseCreator;
