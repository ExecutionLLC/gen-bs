'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.GEN_WS_PORT || 5000,
    sessionHeader: ENV.GEN_WS_SESSION_HEADER || 'X-Session-Id',
    applicationServer: {
        host: ENV.GEN_WS_AS_HOST || '192.168.0.1',
        port: ENV.GEN_WS_AS_PORT || 8000
    },
    database: {
        host: ENV.GEN_WS_DATABASE_SERVER || 'localhost',
        port: ENV.GEN_WS_DATABASE_PORT | 5432,
        user: ENV.GEN_WS_DATABASE_USER || 'postgres',
        password: ENV.GEN_WS_DATABASE_PASSWORD || 'postgres',
        databaseName: ENV.GEN_WS_DATABASE_NAME || 'genomixdb'
    },
    logger: {
        app_name: 'genomix',
        console: {
            level: 'trace'
        },
        file: {
            level: 'warn',
            path: 'logs/genomix.log'
        }
    },
    defaultLanguId: 'en'
};

module.exports = SETTINGS;
