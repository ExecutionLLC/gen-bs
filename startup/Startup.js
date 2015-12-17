'use strict';

const _ = require('lodash');

const DatabaseCreator = require('./DatabaseCreator');

// TODO: Load values from the config file.
const SERVER_HOST = '172.17.0.2';
const USER_NAME = 'postgres';
const PASSWORD = 'zxcasdqwe';
const DATABASE_NAME = 'genomix-db';

class Startup {
    constructor() {
        this.tasks = [];

        // Push all startup tasks into array.
        tasks.push(new DatabaseCreator(SERVER_HOST, USER_NAME, PASSWORD, DATABASE_NAME));
    }

    process() {
        _.forEach(this.tasks, (task) => {
            task.process();
        });
    }
}

module.exports = Startup;
