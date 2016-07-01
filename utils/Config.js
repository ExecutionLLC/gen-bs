'use strict';

const _ = require('lodash');

const ENV = process.env;

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
        maxSizeInBytes: makeDefault(ENV.GEN_WS_UPLOAD_MAX_SIZE, 25 * 1024 * 1024) // Max size of the uploaded sample.
    },
    savedFilesUpload: {
        maxSizeInBytes: makeDefault(ENV.GEN_WS_SAVED_FILES_MAX_SIZE, 1024 * 1024),
        maxCount: makeDefault(ENV.GEN_WS_SAVED_FILES_MAX_COUNT, 2),
        path: makeDefault(ENV.GEN_WS_SAVED_FILES_PATH, __dirname + '/../uploads/'),
        // Object storage type to use. Supported values: 's3', 'oss'
        objectStorageType: makeDefault(ENV.GEN_WS_OBJECT_STORAGE_TYPE, 's3'),
        amazon: {
            amazonS3BucketName: makeDefault(ENV.GEN_WS_S3_BUCKET_NAME, 'placeholder'),
            amazonS3AccessKeyId: makeDefault(ENV.GEN_WS_S3_ACCESS_KEY_ID, 'placeholder'),
            amazonS3AccessKeySecret: makeDefault(ENV.GEN_WS_S3_ACCESS_KEY_SECRET, 'placeholder'),
            amazonS3RegionName: makeDefault(ENV.GEN_WS_S3_REGION_NAME, 'placeholder')
        },
        oss: {
            ossBucketName: makeDefault(ENV.GEN_WS_OSS_BUCKET_NAME, 'placeholder'),
            ossAccessKeyId: makeDefault(ENV.GEN_WS_OSS_ACCESS_KEY_ID, 'placeholder'),
            ossAccessKeySecret: makeDefault(ENV.GEN_WS_OSS_ACCESS_KEY_SECRET, 'placeholder'),
            ossRegionName: makeDefault(ENV.GEN_WS_OSS_REGION_NAME, 'placeholder')
        }
    },
    rabbitMq: {
        host: makeDefault(ENV.GEN_WS_RABBIT_MQ_HOST, 'localhost'),
        requestQueueName: makeDefault(ENV.GEN_WS_RABBIT_MQ_REQUEST_QUERY, 'TaskQueue'),
        // Reconnect timeout in milliseconds
        reconnectTimeout: makeDefault(ENV.GEN_WS_RABBIT_MQ_RECONNECT_TIMEOUT, 10000)
    },
    database: {
        host: makeDefault(ENV.GEN_WS_DATABASE_SERVER, 'localhost'),
        port: makeDefault(ENV.GEN_WS_DATABASE_PORT, 5432),
        user: makeDefault(ENV.GEN_WS_DATABASE_USER, 'postgres'),
        password: makeDefault(ENV.GEN_WS_DATABASE_PASSWORD, ''),
        databaseName: makeDefault(ENV.GEN_WS_DATABASE_NAME, 'genomixdb')
    },
    headers: {
        sessionHeader: makeDefault(ENV.GEN_SESSION_HEADER, 'X-Session-Id'),
        languageHeader: makeDefault(ENV.GEN_LANGUAGE_HEADER, 'X-Langu-Id')
    },
    sessions: {
        allowMultipleUserSessions: makeDefault(ENV.GEN_WS_ALLOW_MULTIPLE_USER_SESSIONS, true),
        sessionTimeoutSec: makeDefault(ENV.GEN_WS_USER_SESSION_TIMEOUT, 5 * 60)
    },
    scheduler: {
        enabled: makeDefault(ENV.GEN_WS_SCHEDULER_ENABLED, true),
        tasks: {
            // Task timeouts in seconds.
            checkSessions: {
                isEnabled: true,
                taskTimeout: 10 * 60
            },
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
    defaultLanguId: 'en'
};

// Add computational fields
// Warning! Currently, base url should be set to HTTP scheme, as otherwise Google sends 'Missing parameter: scope' error.
// The HTTP address will be redirected to HTTPS by NginX.
SETTINGS.baseUrl = makeDefault(ENV.GEN_WS_BASE_URL, 'http://localhost:' + SETTINGS.port);
SETTINGS.google = {
    // Google Application parameters
    clientId: makeDefault(ENV.GEN_WS_GOOGLE_CLIENT_ID, 'placeholder'),
    clientSecret: makeDefault(ENV.GEN_WS_GOOGLE_CLIENT_SECRET, 'placeholder')
};

module.exports = SETTINGS;
