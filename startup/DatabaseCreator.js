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

    create() {
        const postgresConfig = this._createKnexConfigForDatabaseName('postgres');

        const postgresKnex = new Knex(postgresConfig);

        return this._isDatabaseExists(postgresKnex)
        .then(isDatabaseExists => {
            if (!isDatabaseExists) {
                return this._createEmptyDatabase(postgresKnex)
                .then(() => {
                    console.log('Connecting to database...');
                    const databaseConfig = this._createKnexConfigForDatabaseName(this.databaseName);
                    const databaseKnex = new Knex(databaseConfig);

                    return this._createTables(databaseKnex)
                        .then(() => {
                            databaseKnex.destroy();
                        });
                });
            } else {
                console.log('Database is found.');
                return true;
            }
        }).then(() => {
                postgresKnex.destroy();
            });
    }

    _createTables(databaseKnex) {
        return databaseKnex.schema

            // Language
            .createTable('langu', (table) => {
                table.string('id', 2)
                    .primary();
                table.string('description', 20);
            })

            // Users
            .createTable('user', (table) => {
                table.uuid('id')
                    .primary();
                table.string('email', 50);
                table.integer('number_paid_samples');
            })

            .createTable('user_text', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.string('name', 50)
                    .notNullable();
                table.string('last_name', 50);
                table.string('speciality', 50);
            })

            // Filters
            .createTable('filter', table => {
                table.uuid('id')
                    .primary();
                table.uuid('original_filter_id')
                    .references('id')
                    .inTable('filter');
                table.string('name', 50)
                    .notNullable();
                table.json('rules');
                table.string('filter_type', 50)
                    .notNullable();
                table.boolean('is_disabled_4copy');
                table.timestamp('timestamp');
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })

            .createTable('filter_text', table => {
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter')
                    .notNullable();
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu')
                    .notNullable();
                table.string('description', 100);
            })

            .createTable('filter_assignment', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter');
                table.enu('access_rights', ['r', 'rw']);
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
        return postgresKnex.raw('CREATE DATABASE ' + this.databaseName);
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
