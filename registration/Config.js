'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');

// Load default config but prefer env variables
const DEFAULT_CONFIG_PATH = path.resolve(`${__dirname}/default-env.json`);
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

const port = makeDefault(ENV.GEN_REG_PORT, 3000);

const SETTINGS = {
    port: port,
    baseUrl: makeDefault(ENV.GEN_REG_BASE_URL, `http://localhost:${port}/register`),
    enableCORS: makeDefault(ENV.GEN_REG_CORS_ENABLE, true),
    disableRequestLimits: makeDefault(ENV.GEN_REG_DISABLE_REQUEST_LIMITS, false),
    adminDataKey: makeDefault(ENV.GEN_REG_ADMIN_DATA_KEY, '3a92a566-caf6-4f17-a23e-1cd7f728d166'),
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
        httpScheme: makeDefault(ENV.GEN_REG_WS_SCHEME, 'http'),
        host: makeDefault(ENV.GEN_REG_WS_HOST, 'localhost'),
        port: makeDefault(ENV.GEN_REG_WS_PORT, 80),
        ADD_USER_KEY: makeDefault(ENV.GEN_REG_WS_ADD_USER_KEY, 'b5b7a458-693c-4a8d-845b-7b9a1295a15b')
    },
    reCaptcha: {
        SECRET: '6LeJIAkUAAAAAGj8peLFmyG1Olmv9E6aOajh43Nx'
    },
    registrationFrontend: {
        site: makeDefault(ENV.GEN_REG_FRONTEND_SITE, 'http://alapy.com'),
        regcodeIdPath: makeDefault(ENV.GEN_REG_FRONTEND_REGCODE_ID_PATH, '/register/'),
        emailConfirmedPath: makeDefault(ENV.GEN_REG_FRONTEND_EMAIL_CONFIRMED, '/email-confirmed'),
    },
    mailChimp: {
        key: makeDefault(ENV.GEN_WS_MAIL_KEY, 'placeholder'),
        adminEmail: makeDefault(ENV.GEN_WS_MAIL_ADMIN_MAIL, 'petr.ponomarenko@alapy.com'),
        fromEmail: makeDefault(ENV.GEN_WS_MAIL_FROM_MAIL, 'info@alapy.com'),
        fromName: makeDefault(ENV.GEN_WS_MAIL_FROM_NAME, 'ALAPY'),
        userRegisterTemplate: makeDefault(ENV.GEN_WS_MAIL_USER_REGISTER_TEMPLATE, 'TestGenomicsTemplate'),
        userRegisterCodeTemplate: makeDefault(ENV.GEN_WS_MAIL_USER_REGISTER_CODE_TEMPLATE, 'V-objem: Successful user register'),
        userRegisterApproveTemplate: makeDefault(ENV.GEN_WS_MAIL_USER_REGISTER_APPROVE_TEMPLATE, 'TestGenomicsApprovedTemplate'),
        adminRegisterTemplate: makeDefault(ENV.GEN_WS_MAIL_ADMIN_REGISTER_TEMPLATE, 'TestGenomicsAdminApproveTemplate'),
        adminRegisterApproveTemplate: makeDefault(ENV.GEN_WS_MAIL_ADMIN_REGISTER_APPROVE_TEMPLATE, 'TestGenomicsAdminApproveCompleteTemplate')
    }
};

console.log(`Configuration:\n${JSON.stringify(SETTINGS, null, 2)}`);

module.exports = SETTINGS;
