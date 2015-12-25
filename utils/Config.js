'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.PORT || 5000,
    applicationServer: {
        host: ENV.AS_HOST || '192.168.1.102',
        port: ENV.AS_WS_PORT || 8888,
        authTokenHeader: ENV.WS_AUTH_TOKEN_HEADER || 'X-Auth-Token',
        sessionHeader: ENV.WS_SESSION_HEADER || 'X-Session-Id'
    },
    database: {
        host: ENV.WS_DATABASE_SERVER || 'localhost',
        user: ENV.WS_DATABASE_USER || 'postgres',
        password: ENV.WS_DATABASE_PASSWORD || 'postgres',
        databaseName: ENV.WS_DATABASE_NAME || 'genomixdb'
    }
};

module.exports = SETTINGS;