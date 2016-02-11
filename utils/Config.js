'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.GEN_WS_PORT || 5000,
    enableCORS: ENV.GEN_WS_CORS_ENABLE || true,
    allowMultipleUserSessions: ENV.GEN_WS_ALLOW_MULTIPLE_USER_SESSIONS || true,
    sessionHeader: ENV.GEN_WS_SESSION_HEADER || 'X-Session-Id',
    languageHeader: ENV.GEN_WS_LANGUAGE_HEADER || 'X-Langu-Id',
    forceOverrideRedisToLocalhost: ENV.GEN_WS_FORCE_OVERRIDE_REDIS_TO_LOCALHOST || false,
    uploadPath: ENV.GEN_WS_UPLOAD_PATH || __dirname + '../uploads/',
    uploadMaxSizeInBytes: ENV.GEN_WS_UPLOAD_MAX_SIZE || 25 * 1024 * 1024,
    uploadMaxCount: ENV.GEN_WS_UPLOAD_MAX_COUNT || 5,
    applicationServer: {
        host: ENV.GEN_WS_AS_HOST || 'localhost',
        port: ENV.GEN_WS_AS_PORT || 8888
    },
    database: {
        host: ENV.GEN_WS_DATABASE_SERVER || 'localhost',
        port: ENV.GEN_WS_DATABASE_PORT | 5432,
        user: ENV.GEN_WS_DATABASE_USER || 'postgres',
        password: ENV.GEN_WS_DATABASE_PASSWORD || 'zxcasdqwe',
        databaseName: ENV.GEN_WS_DATABASE_NAME || 'genomixdb'
    },
    logger: {
        app_name: 'genomix',
        console: {
            level: 'trace'
        },
        file: {
            level: 'trace',
            path: 'logs/genomix.log'
        }
    },
    defaultLanguId: 'en'
};

module.exports = SETTINGS;
