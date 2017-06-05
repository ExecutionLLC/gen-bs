'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');

// Load default config but prefer env variables
const DEFAULT_CONFIG_PATH = path.resolve(`${__dirname}/../default-env.json`);
let defaultConfig = {};
try {
    defaultConfig = require(DEFAULT_CONFIG_PATH);
} catch (e) {
    console.log(`Default config is not found by path ${DEFAULT_CONFIG_PATH}`);
}

const ENV = Object.assign({}, defaultConfig, process.env);

function makeDefault(value, defaultValue) {
    if (_.isUndefined(value)) {
        return defaultValue;
    }

    if (_.isBoolean(defaultValue)) {
        value = JSON.parse(value);
    }
    return value;
}

const SETTINGS = {
    port: makeDefault(ENV.GEN_WS_PORT, 5000),
    disableRequestLimits: makeDefault(ENV.GEN_WS_DISABLE_REQUEST_LIMITS, false),
    enableCORS: makeDefault(ENV.GEN_WS_CORS_ENABLE, true),
    // If true, the 'callbackPort' variable will be supported in the SessionsController.
    // This setting is very security-critical and should be set to false in production.
    enableAuthCallbackPorts: makeDefault(ENV.GEN_WS_ENABLE_AUTH_CALLBACK_PORTS, false),
    // If true, Redis host will be ignored in the data received from AS, and localhost
    // will always be used. This is convenient when port forwarding to Redis server is used.
    forceOverrideRedisToLocalhost: makeDefault(ENV.GEN_WS_FORCE_OVERRIDE_REDIS_TO_LOCALHOST, false),
    // If true, samples will not be marked as analyzed, and there will be no fee from the user.
    disableMakeAnalyzed: makeDefault(ENV.GEN_WS_DISABLE_MAKE_ANALYZED, true),
    // If enabled, demo users will have rights to create and delete filters and samples.
    // These filters and samples will be shared between them, as there is only one demo-user in the system.
    enableFullRightsForDemoUsers: makeDefault(ENV.GEN_WS_ENABLE_FULL_RIGHTS_FOR_DEMO_USERS, false),
    // If true, client messages will include stack traces.
    includeStackTraceToErrors: makeDefault(ENV.GEN_WS_INCLUDE_STACK_TRACE, false),
    samplesUpload: {
        path: makeDefault(ENV.GEN_WS_UPLOAD_PATH, __dirname + '/../uploads/'), // Temporary path for uploaded samples.
        maxSizeInBytes: makeDefault(ENV.GEN_WS_UPLOAD_MAX_SIZE, 25 * 1024 * 1024), // Max size of the uploaded sample.
        maxCountPerUser: makeDefault(ENV.GEN_WS_UPLOAD_MAX_COUNT, 15) // Maximum active uploads per user.
    },
    objectStorage: {
        // Object storage type to use. Supported values: 's3', 'oss'
        type: makeDefault(ENV.GEN_WS_OBJECT_STORAGE_TYPE, 's3'),
        // parameters in the sections below are expected to have same names,
        // as they are used in the services interchangeably.
        s3: {
            accessKeyId: makeDefault(ENV.GEN_WS_S3_ACCESS_KEY_ID, 'placeholder'),
            accessKeySecret: makeDefault(ENV.GEN_WS_S3_ACCESS_KEY_SECRET, 'placeholder'),
            regionName: makeDefault(ENV.GEN_WS_S3_REGION_NAME, 'placeholder'),
            savedFilesBucket: makeDefault(ENV.GEN_WS_S3_SAVED_FILES_BUCKET_NAME, 'placeholder'),
            newSamplesBucket: makeDefault(ENV.GEN_WS_S3_NEW_SAMPLES_BUCKET_NAME, 'placeholder')
        },
        oss: {
            accessKeyId: makeDefault(ENV.GEN_WS_OSS_ACCESS_KEY_ID, 'placeholder'),
            accessKeySecret: makeDefault(ENV.GEN_WS_OSS_ACCESS_KEY_SECRET, 'placeholder'),
            regionName: makeDefault(ENV.GEN_WS_OSS_REGION_NAME, 'placeholder'),
            savedFilesBucket: makeDefault(ENV.GEN_WS_OSS_SAVED_FILES_BUCKET_NAME, 'placeholder'),
            newSamplesBucket: makeDefault(ENV.GEN_WS_OSS_NEW_SAMPLES_BUCKET_NAME, 'placeholder')
        },
        file: {
            savedFilesPath: makeDefault(ENV.GEN_WS_FILE_SAVED_FILES_PATH, 'placeholder'),
            newSamplesPath: makeDefault(ENV.GEN_WS_FILE_NEW_SAMPLES_PATH, 'placeholder')
        }
    },
    savedFilesUpload: {
        maxSizeInBytes: makeDefault(ENV.GEN_WS_SAVED_FILES_MAX_SIZE, 1024 * 1024),
        maxCount: makeDefault(ENV.GEN_WS_SAVED_FILES_MAX_COUNT, 2),
        path: makeDefault(ENV.GEN_WS_SAVED_FILES_PATH, __dirname + '/../uploads/')
    },
    redis: {
        host: makeDefault(ENV.GEN_WS_REDIS_HOST, 'localhost'),
        port: makeDefault(ENV.GEN_WS_REDIS_PORT, 6379),
        databaseNumber: makeDefault(ENV.GEN_WS_REDIS_DATABASE_NUMBER, 0),
        password: makeDefault(ENV.GEN_WS_REDIS_PASSWORD, null)
    },
    rabbitMq: {
        host: makeDefault(ENV.GEN_WS_RABBIT_MQ_HOST, 'localhost'),
        port: makeDefault(ENV.GEN_WS_RABBIT_MQ_PORT, 5672),
        user: makeDefault(ENV.GEN_WS_RABBIT_MQ_USER, 'guest'),
        virtualHost: makeDefault(ENV.GEN_WS_RABBIT_MQ_VIRTUAL_HOST, ''),
        password: makeDefault(ENV.GEN_WS_RABBIT_MQ_PASSWORD, 'guest'),
        requestExchangeName: makeDefault(ENV.GEN_WS_RABBIT_MQ_REQUEST_EXCHANGE, 'genomics_exchange'),
        // Reconnect timeout in milliseconds
        reconnectTimeout: makeDefault(ENV.GEN_WS_RABBIT_MQ_RECONNECT_TIMEOUT, 10000)
    },
    database: {
        client: 'pg',
        host: makeDefault(ENV.GEN_WS_DATABASE_SERVER, 'localhost'),
        port: makeDefault(ENV.GEN_WS_DATABASE_PORT, 5432),
        user: makeDefault(ENV.GEN_WS_DATABASE_USER, 'postgres'),
        password: makeDefault(ENV.GEN_WS_DATABASE_PASSWORD, ''),
        databaseName: makeDefault(ENV.GEN_WS_DATABASE_NAME, 'genomixdb')
    },
    headers: {
        // Session header is used for testing only.
        sessionHeader: makeDefault(ENV.GEN_WS_TEST_SESSION_HEADER, 'X-Session-Id'),
        languageHeader: makeDefault(ENV.GEN_LANGUAGE_HEADER, 'X-Language-Id')
    },
    sessions: {
        sessionCookieName: makeDefault(ENV.GEN_WS_SESSION_COOKIE_NAME, 'gen-ws-session'),
        sessionSecret: makeDefault(ENV.GEN_WS_SESSION_SECRET, 'session-secret-here'),
        allowMultipleUserSessions: makeDefault(ENV.GEN_WS_ALLOW_MULTIPLE_USER_SESSIONS, true),
        sessionTimeoutSec: makeDefault(ENV.GEN_WS_USER_SESSION_TIMEOUT, 5 * 60)
    },
    scheduler: {
        enabled: makeDefault(ENV.GEN_WS_SCHEDULER_ENABLED, true),
        tasks: {
            // Task timeouts in seconds.
            importSourceMetadata: {
                isEnabled: true,
                taskTimeout: 60 * 60,
                // Timeout in milliseconds to wait for AS RPC connection.
                reconnectTimeout: 15000
            }
        }
    },
    logger: {
        app_name: 'genomix',
        console: {
            level: makeDefault(ENV.GEN_WS_CONSOLE_LOG_LEVEL, 'trace')
        },
        file: {
            level: makeDefault(ENV.GEN_WS_LOG_LEVEL, 'trace'),
            path: makeDefault(ENV.GEN_WS_LOG_PATH, __dirname + '/../logs/genomix.log'),
            rotatingFilesCount: 7
        }
    },
    defaultLanguId: 'en',
    regserver: {
        SCHEME: makeDefault(ENV.GEN_WS_REG_SCHEME, 'http'),
        HOST: makeDefault(ENV.GEN_WS_REG_HOST, 'localhost'),
        PORT: makeDefault(ENV.GEN_WS_REG_PORT, 3000),
        ADD_USER_KEY: makeDefault(ENV.GEN_WS_REG_ADD_USER_KEY, 'b5b7a458-693c-4a8d-845b-7b9a1295a15b')
    },
    serverId: makeDefault(ENV.GEN_WS_SERVER_ID, '')
};

// Add computational fields
// Base url is used for auth redirects and enabling auth headers in CORS.
// Warning! Currently, base url should be set to HTTP scheme, as otherwise Google sends 'Missing parameter: scope' error.
// The HTTP address will be redirected to HTTPS by NginX.
SETTINGS.baseUrl = makeDefault(ENV.GEN_WS_BASE_URL, 'http://localhost:' + SETTINGS.port);
SETTINGS.google = {
    // Google Application parameters
    clientId: makeDefault(ENV.GEN_WS_GOOGLE_CLIENT_ID, 'placeholder'),
    clientSecret: makeDefault(ENV.GEN_WS_GOOGLE_CLIENT_SECRET, 'placeholder')
};

module.exports = SETTINGS;
