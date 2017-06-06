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
    constructor(serverHost, serverPort, userName, password, databaseName) {
        this.serverHost = serverHost;
        this.serverPort = serverPort;
        this.userName = userName;
        this.password = password;
        this.databaseName = databaseName;
    }

    create(dontRecreate) {
        const postgresConfig = this._createKnexConfigForDatabaseName('postgres');

        const postgresKnex = new Knex(postgresConfig);

        return new Promise((resolve, reject) => {
            this._isDatabaseExists(postgresKnex)
                .then(isDatabaseExists => {
                    if (isDatabaseExists) {
                        if (dontRecreate) {
                            console.log('Database already exist, leave it: ' + this.databaseName);
                            return Promise.resolve(true);
                        } else {
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
                                })
                                .then(() => {
                                    return Promise.resolve(false);
                                });
                        }
                    } else {
                        return this._createDatabase(postgresKnex)
                            .catch((error) => {
                                return Promise.reject('Failed to create database. ' + error);
                            })
                            .then(() => {
                                return Promise.resolve(false);
                            });
                    }
                })
                .then((result) => {
                    console.log('Database created: ' + this.databaseName + '.');
                    resolve(result);
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
        // Possible values for entity types, such as filters and views.
        const entityTypeEnumValues = [
            'standard', // Available for demo user
            'advanced', // Shown in demo, but locked. Available for registered users.
            'user' , // Created by user.
            'default' //default entity type
        ];

        // Entity access rights, allowing users to share things like filters and views
        const accessRightsEnumValues = [
            'r', // Share as read-only
            'rw' // Share as read-write
        ];

        // Type of source as they are got from VCF.
        const fieldSourceTypesEnumValues = [
            'sample',
            'source'
        ];

        // Types of fields as they are got from VCF.
        const fieldValueTypesEnumValues = [
            'float',
            'integer',
            'char',
            'string',
            'boolean'
        ];

        const sortDirectionEnumValues = [
            'asc',
            'desc'
        ];

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
                table.string('default_langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.integer('number_paid_samples');
                table.boolean('is_deleted')
                    .defaultTo(false);
            })
            .createTable('user_text', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('name', 50)
                    .notNullable();
                table.string('last_name', 50);
                table.string('speciality', 50);

                table.primary(['user_id', 'langu_id']);
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
                table.enu('type', entityTypeEnumValues);
                table.boolean('is_copy_disabled')
                    .defaultTo(false);
                table.boolean('is_deleted')
                    .defaultTo(false);
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })
            .createTable('filter_text', table => {
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('description', 512);

                table.primary(['filter_id', 'langu_id']);
            })
            .createTable('filter_assignment', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter');
                table.enu('access_rights', accessRightsEnumValues);

                table.primary(['user_id', 'filter_id']);
            })

            // Fields
            .createTable('field_metadata', table => {
                table.uuid('id')
                    .primary();
                table.string('name', 50);
                table.string('source_name', 128);
                table.enu('value_type', fieldValueTypesEnumValues);
                table.boolean('is_mandatory')
                    .defaultTo(false);
                table.boolean('is_editable')
                    .defaultTo(true);
                table.boolean('is_invisible')
                    .defaultTo(false);
                table.integer('dimension');
            })
            .createTable('field_text', table => {
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.text('description');
                table.string('label', 128);

                table.primary(['field_id', 'langu_id']);
            })
            .createTable('field_available_value', table => {
                table.uuid('id')
                    .primary();
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
            })
            .createTable('field_available_value_text', table => {
                table.uuid('field_available_value_id')
                    .references('id')
                    .inTable('field_available_value');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('value', 100);

                table.primary(['field_available_value_id', 'langu_id']);
            })

            // Keywords
            .createTable('keyword', table => {
                table.uuid('id')
                    .primary();
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
                table.string('value', 50);
            })
            .createTable('synonym_text', table => {
                table.uuid('id');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.uuid('keyword_id')
                    .references('id')
                    .inTable('keyword');
                table.string('value', 50);

                table.primary(['id', 'langu_id']);
            })

            // Views
            .createTable('view', table => {
                table.uuid('id')
                    .primary();
                table.uuid('original_view_id')
                    .references('id')
                    .inTable('view');
                table.string('name', 50);
                table.enu('type', entityTypeEnumValues);
                table.boolean('is_copy_disabled')
                    .defaultTo(false);
                table.boolean('is_deleted')
                    .defaultTo(false);
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })
            .createTable('view_text', table => {
                table.uuid('view_id')
                    .references('id')
                    .inTable('view');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('description', 512);
            })
            .createTable('view_assignment', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.uuid('view_id')
                    .references('id')
                    .inTable('view');
                table.enu('access_rights', accessRightsEnumValues);

                table.primary(['user_id', 'view_id']);
            })
            .createTable('view_item', table => {
                table.uuid('id')
                    .primary();
                table.uuid('view_id')
                    .references('id')
                    .inTable('view');
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
                table.integer('order');
                table.integer('sort_order');
                table.enu('sort_direction', sortDirectionEnumValues);
                table.boolean('filter_control_enable')
                    .defaultTo(true);
            })
            .createTable('view_item_keyword', table => {
                table.uuid('keyword_id')
                    .references('id')
                    .inTable('keyword');
                table.uuid('view_item_id')
                    .references('id')
                    .inTable('view_item');
                table.primary(['keyword_id', 'view_item_id']);
            })

            // Comments
            .createTable('comment', table => {
                table.uuid('id')
                    .primary();
                table.string('reference', 50);
                table.string('chrom', 50);
                table.integer('pos');
                table.string('alt', 50);
                // Field is needed to fetch comments. The comment is currently assigned to the search key,
                // which can be the same for different samples. Comments should be fetched by that search key.
                table.bigInteger('search_key');
                table.boolean('is_deleted')
                    .defaultTo(false);
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })
            .createTable('comment_text', table => {
                table.uuid('comment_id')
                    .references('id')
                    .inTable('comment');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('comment', 1024);
            })
            .createTable('comment_assignment', table => {
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.uuid('comment_id')
                    .references('id')
                    .inTable('comment');
                table.enu('access_rights', accessRightsEnumValues);

                table.primary(['user_id', 'comment_id']);
            })

            // Samples
            .createTable('vcf_file_sample', table => {
                table.uuid('id')
                    .primary();
                table.string('file_name', 256)
                    .notNullable();
                table.string('hash', 128);
                table.enu('type', entityTypeEnumValues)
                    .notNullable();
                table.boolean('is_analyzed')
                    .defaultTo(false);
                table.boolean('is_deleted')
                    .defaultTo(false);
                table.timestamp('analyzed_timestamp');
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })
            .createTable('vcf_file_sample_assignment', table => {
                table.uuid('vcf_file_sample_id')
                    .references('id')
                    .inTable('vcf_file_sample');
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.enu('access_rights', accessRightsEnumValues);

                table.primary(['vcf_file_sample_id', 'user_id']);
            })
            .createTable('vcf_file_sample_version', table => {
                table.uuid('id')
                    .primary();
                table.uuid('vcf_file_sample_id')
                    .references('id')
                    .inTable('vcf_file_sample');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
            })
            .createTable('vcf_file_sample_value', table => {
                table.uuid('vcf_file_sample_version_id')
                    .references('id')
                    .inTable('vcf_file_sample_version');
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
                table.string('values', 100);

                table.primary(['vcf_file_sample_version_id', 'field_id']);
            })

            // Saved files
            .createTable('saved_file', table => {
                table.uuid('id')
                    .primary();
                table.uuid('vcf_file_sample_version_id')
                    .references('id')
                    .inTable('vcf_file_sample_version')
                    .notNullable();
                table.uuid('view_id')
                    .references('id')
                    .inTable('view')
                    .notNullable();
                table.string('name', 256);
                table.string('url', 2048);
                table.integer('total_results');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
                table.boolean('is_deleted')
                    .defaultTo(false);
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
            })
            .createTable('saved_file_assignment', table => {
                table.uuid('saved_file_id')
                    .references('id')
                    .inTable('saved_file');
                table.uuid('user_id')
                    .references('id')
                    .inTable('user');
                table.enu('access_rights', accessRightsEnumValues);

                table.primary(['saved_file_id', 'user_id']);
            })
            .createTable('saved_file_filter', table => {
                table.uuid('saved_file_id')
                    .references('id')
                    .inTable('saved_file');
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter');

            })
            .createTable('saved_file_text', table => {
                table.uuid('saved_file_id')
                    .references('id')
                    .inTable('saved_file');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('description', 512);

                table.primary(['saved_file_id', 'langu_id']);
            })

            // Query history
            .createTable('query_history', table => {
                table.uuid('id')
                    .primary();
                table.uuid('vcf_file_sample_version_id')
                    .references('id')
                    .inTable('vcf_file_sample_version')
                    .notNullable();
                table.uuid('view_id')
                    .references('id')
                    .inTable('view')
                    .notNullable();
                table.integer('total_results');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
                table.uuid('creator')
                    .references('id')
                    .inTable('user')
                    .notNullable();
            })
            .createTable('query_history_filter', table => {
                table.uuid('query_history_id')
                    .references('id')
                    .inTable('query_history');
                table.uuid('filter_id')
                    .references('id')
                    .inTable('filter');

                table.primary(['query_history_id', 'filter_id']);
            })

            .then(() => {
                console.log('Tables created successfully.')
            })
            ;
    }

    _createEmptyDatabase(postgresKnex) {
        // Create database
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

module.exports = DatabaseCreator;
