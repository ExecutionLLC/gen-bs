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
    port: makeDefault(ENV.GEN_REG_PORT, 3000),
    enableCORS: makeDefault(ENV.GEN_REG_CORS_ENABLE, true),
    disableRequestLimits: makeDefault(ENV.GEN_REG_DISABLE_REQUEST_LIMITS, false),
    database: {
        client: 'pg',
        host: makeDefault(ENV.GEN_REG_DATABASE_HOST, 'localhost'),
        port: makeDefault(ENV.GEN_REG_DATABASE_PORT, 5432),
        user: makeDefault(ENV.GEN_REG_DATABASE_USER, 'postgres'),
        password: makeDefault(ENV.GEN_REG_DATABASE_PASSWORD, ''),
        databaseName: makeDefault(ENV.GEN_REG_DATABASE_NAME, 'genomixreg')
    },
    logger: {
        app_name: 'regserver',
        console: {
            level: makeDefault(ENV.GEN_REG_CONSOLE_LOG_LEVEL, 'trace')
        },
        file: {
            level: makeDefault(ENV.GEN_REG_LOG_LEVEL, 'trace'),
            path: makeDefault(ENV.GEN_REG_LOG_PATH, __dirname + '/../logs/regserver.log'),
            rotatingFilesCount: 7
        }
    },
    usersClient: {
        httpScheme: 'http',
        host: 'localhost',
        port: 80
    }
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
