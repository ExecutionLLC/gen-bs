'use strict';

const Knex = require('knex');
const Uuid = require('node-uuid');

const Config = require('../utils/Config');
const databaseSettings = Config.database;

const knexConfig = {
    client: 'pg',
    connection: {
        host: databaseSettings.host,
        user: databaseSettings.user,
        password: databaseSettings.password,
        database: databaseSettings.databaseName
    }
};

// Knex instance should only be created once per application.
const knexSingleton = new Knex(knexConfig);

class ModelBase {
    constructor(models, baseTable) {
        this.models = models;
        this.baseTable = baseTable;

        this.knex = knexSingleton;
    }

    _generateId() {
        // Generate random UUID
        return Uuid.v4();
    }
}

module.exports = ModelBase;
