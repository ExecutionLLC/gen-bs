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
