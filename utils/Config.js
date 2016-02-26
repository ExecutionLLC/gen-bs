'use strict';

const ENV = process.env;

const SETTINGS = {
    port: ENV.GEN_WS_PORT || 5000,
    enableCORS: ENV.GEN_WS_CORS_ENABLE || true,
    // If true, redis host will be ignored and localhost will always be used.
    // This is convenient when port forwarding to Redis server is used.
    forceOverrideRedisToLocalhost: ENV.GEN_WS_FORCE_OVERRIDE_REDIS_TO_LOCALHOST || false,
    upload: {
        path: ENV.GEN_WS_UPLOAD_PATH || __dirname + '/../uploads/', // Temporary path for uploaded samples.
        maxSizeInBytes: ENV.GEN_WS_UPLOAD_MAX_SIZE || 25 * 1024 * 1024, // Max size of the uploaded sample.
        maxCount: ENV.GEN_WS_UPLOAD_MAX_COUNT || 5 // Max parallel uploads count.
    },
    applicationServer: {
        host: ENV.GEN_WS_AS_HOST || 'localhost',
        port: ENV.GEN_WS_AS_PORT || 8888
    },
    database: {
        host: ENV.GEN_WS_DATABASE_SERVER || 'localhost',
        port: ENV.GEN_WS_DATABASE_PORT || 5432,
        user: ENV.GEN_WS_DATABASE_USER || 'postgres',
        password: ENV.GEN_WS_DATABASE_PASSWORD || 'zxcasdqwe',
        databaseName: ENV.GEN_WS_DATABASE_NAME || 'genomixdb'
    },
    headers: {
        sessionHeader: ENV.GEN_WS_SESSION_HEADER || 'X-Session-Id',
        languageHeader: ENV.GEN_WS_LANGUAGE_HEADER || 'X-Langu-Id'
    },
    sessions: {
        allowMultipleUserSessions: ENV.GEN_WS_ALLOW_MULTIPLE_USER_SESSIONS || true,
        sessionTimeoutSec: ENV.GEN_WS_USER_SESSION_TIMEOUT || 300
    },
    scheduler: {
        enabled: ENV.GEN_WS_SCHEDULE_ENABLED || true,
        tasks: {
            checkSessions: {
                isEnabled: true,
                taskTimeout: 30
            },
            importSourceMetadata: {
                isEnabled: true,
                taskTimeout: 60 * 60
            }
        }
    },
    logger: {
        app_name: 'genomix',
        console: {
            level: ENV.GEN_WS_CONSOLE_LOG_LEVEL || 'trace'
        },
        file: {
            level: ENV.GEN_WS_LOG_LEVEL || 'trace',
            path: ENV.GEN_WS_LOG_PATH || __dirname + '/../logs/genomix.log'
        }
    },
    defaultLanguId: 'en'
};

// Add computational fields
SETTINGS.baseUrl = ENV.GEN_WS_BASE_URL || 'http://localhost:' + SETTINGS.port;
SETTINGS.google = {
    // Google Application parameters
    clientId: ENV.GEN_WS_GOOGLE_CLIENT_ID || '1051611087780-4eo3v6k4oboivgha2l8jbi9jd6b0bfe9.apps.googleusercontent.com',
    clientSecret: ENV.GEN_WS_GOOGLE_CLIENT_SECRET || '7U3OeIgx-wO86CAGT7xYOGIz'
};

module.exports = SETTINGS;
