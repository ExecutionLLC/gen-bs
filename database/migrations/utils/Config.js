'use strict';

const SETTINGS = {
    oneSampleGenotypeName: null,
    database: {
        client: 'pg',
        host: makeDefault(ENV.GEN_WS_DATABASE_SERVER, 'localhost'),
        port: makeDefault(ENV.GEN_WS_DATABASE_PORT, 5432),
        user: makeDefault(ENV.GEN_WS_DATABASE_USER, 'postgres'),
        password: makeDefault(ENV.GEN_WS_DATABASE_PASSWORD, ''),
        databaseName: makeDefault(ENV.GEN_WS_DATABASE_NAME, 'genomixdb')
    },
    defaultLanguId: 'en'
};

module.exports = SETTINGS;
