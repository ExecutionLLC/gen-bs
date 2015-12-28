'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.PORT || 5000,
    sessionHeader: ENV.WS_SESSION_HEADER || 'X-Session-Id',
    applicationServer: {
        host: ENV.AS_HOST || 'localhost',
        port: ENV.AS_PORT || 8888
    },
    database: {
        host: ENV.WS_DATABASE_SERVER || 'localhost',
        user: ENV.WS_DATABASE_USER || 'postgres',
        password: ENV.WS_DATABASE_PASSWORD || 'postgres',
        databaseName: ENV.WS_DATABASE_NAME || 'genomixdb'
    }
};

module.exports = SETTINGS;