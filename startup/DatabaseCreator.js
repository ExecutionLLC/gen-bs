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

        return new Promise((resolve, reject) => {
            this._isDatabaseExists(postgresKnex)
                .then(isDatabaseExists => {
                    if (!isDatabaseExists) {
                        return this._createEmptyDatabase(postgresKnex)
                            .then(() => {
                                console.log('Connecting to database...');
                                const databaseConfig = this._createKnexConfigForDatabaseName(this.databaseName);
                                const databaseKnex = new Knex(databaseConfig);

                                return this._createTables(databaseKnex)
                                    .finally(() => {
                                        console.log('Destroying database context...');
                                        databaseKnex.destroy();
                                    })
                                    ;
                            });
                    } else {
                        // TODO: можно вставить DROP DATABASE, есть работающий способ
                        console.log('Database is found.');
                    }
                }).then(() => {
                resolve();
            })
            .catch((error) => {
                console.log('Caught error, dropping database ' + this.databaseName);
                postgresKnex.raw('DROP DATABASE ' + this.databaseName)
                    .then(() => {
                        reject(error);
                    }).catch((dropError) => {
                        console.error('Failed to drop database: ' + dropError);
                        reject(error);
                    });
                reject(error);
            })
            .finally(() => {
                console.log('Destroying postgres database context..');
                postgresKnex.destroy();
            });
        });
    }

    _createTables(databaseKnex) {
        // Possible values for entity types, such as filters and views.
        const entityTypeEnumValues = [
            'standard', // Available for demo user
            'advanced', // Shown in demo, but locked. Available for registered users.
            'user' // Created by user.
        ];

        // Entity access rights, allowing users to share things like filters and views
        const accessRightsEnumValues = [
            'r', // Share as read-only
            'rw' // Share as read-write
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

        // Status of the sample upload process. Pending samples will
        // be removed when the service starts.
        const sampleStatusEnumValues = [
            'pending',  // The sample is somewhere in the middle.
            'ready'     // Sample is ready for search requests.
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
                table.enu('filter_type', entityTypeEnumValues);
                table.boolean('is_disabled_4copy')
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
                table.string('description', 100);

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
                table.boolean('filter_control_enable');
                table.boolean('is_mandatory');
                table.boolean('is_editable');
                table.boolean('is_invisible');
                table.boolean('is_multi_select');
            })
            .createTable('field_text', table => {
                table.uuid('field_id')
                    .references('id')
                    .inTable('field_metadata');
                table.string('langu_id', 2)
                    .references('id')
                    .inTable('langu');
                table.string('description', 100);

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
                table.uuid('available_value_id')
                    .references('id')
                    .inTable('field_available_value');
                table.string('langu_id', 2);
                table.string('value', 100);

                table.primary(['available_value_id', 'langu_id']);
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
                table.enu('view_type', entityTypeEnumValues);
                table.boolean('is_disabled_4copy');
                table.boolean('is_deleted');
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
                table.string('description', 100);
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
                table.bigInteger('search_key');
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
                table.string('file_name', 50);
                table.string('hash', 50);
                table.enu('sample_type', entityTypeEnumValues);
                table.enu('status', sampleStatusEnumValues);
                table.boolean('is_analyzed');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
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
                    .inTable('vcf_file_sample_version');
                table.uuid('view_id')
                    .references('id')
                    .inTable('view');
                table.string('name', 50);
                table.string('url', 2048);
                table.integer('total_results');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
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
                table.string('description', 100);

                table.primary(['saved_file_id', 'langu_id']);
            })

            // Query history
            .createTable('query_history', table => {
                table.uuid('id')
                    .primary();
                table.uuid('vcf_file_sample_version_id')
                    .references('id')
                    .inTable('vcf_file_sample_version');
                table.uuid('view_id')
                    .references('id')
                    .inTable('view');
                table.integer('total_results');
                table.timestamp('timestamp')
                    .defaultTo(databaseKnex.fn.now());
                table.uuid('creator')
                    .references('id')
                    .inTable('user');
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
