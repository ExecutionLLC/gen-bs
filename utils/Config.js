'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.PORT || 5000,
    applicationServer: {
        host: ENV.AS_HOST || 'localhost',
        port: ENV.AS_WS_PORT || 8888,
        authTokenHeader: ENV.WS_AUTH_TOKEN_HEADER || 'X-Auth-Token',
        sessionHeader: ENV.WS_SESSION_HEADER || 'X-Session-Id'
    },
    database: {
        host: ENV.WS_DATABASE_SERVER || '172.17.0.2',
        user: ENV.WS_DATABASE_USER || 'postgres',
        password: ENV.WS_DATABASE_PASSWORD || 'zxcasdqwe',
        databaseName: ENV.WS_DATABASE_NAME || 'genomixdb'
    }
};

module.exports = SETTINGS;