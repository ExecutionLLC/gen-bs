const {
    database: {
        client,
        host,
        port,
        user,
        password,
        databaseName: database
    }
} = require('../Config');

console.log(`Using database '${database}' on ${host}:${port}`);

// Table with metadata for Knex migrations.
const MIGRATIONS_TABLE_NAME = 'knex_migrations';

const migrationSettings = {
    client,
    connection: {
        host,
        port,
        user,
        password,
        database
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: MIGRATIONS_TABLE_NAME
    }
};

module.exports = {
    development: migrationSettings,
    staging: migrationSettings,
    production: migrationSettings
};
