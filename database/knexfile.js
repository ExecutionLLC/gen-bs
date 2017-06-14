const {
    database: {
        client,
        host,
        port,
        user,
        password,
        databaseName: database
    }
} = require('./migrations/utils/Config');

console.log(`Using database '${database}' on ${host}:${port}`);

// Table with metadata for Knex migrations.
const migrationsTableName = 'knex_migrations';

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
        tableName: migrationsTableName
    }
};

module.exports = {
    development: migrationSettings,
    staging: migrationSettings,
    production: migrationSettings
};
