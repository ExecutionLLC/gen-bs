'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.GEN_WS_PORT || 5000,
    sessionHeader: ENV.GEN_WS_SESSION_HEADER || 'X-Session-Id',
    applicationServer: {
        host: ENV.GEN_WS_AS_HOST || 'localhost',
        port: ENV.GEN_WS_AS_PORT || 8888
    },
    database: {
        host: ENV.GEN_WS_DATABASE_SERVER || 'localhost',
        user: ENV.GEN_WS_DATABASE_USER || 'postgres',
        password: ENV.GEN_WS_DATABASE_PASSWORD || 'zxcasdqwe',
        databaseName: ENV.GEN_WS_DATABASE_NAME || 'genomixdb'
    }
};

module.exports = SETTINGS;
