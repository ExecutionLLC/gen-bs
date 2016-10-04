'use strict';
const knex = require('knex');
const knexfile = require('./../knexfile');

// It is impossible to create database during migrations,
// therefore use knex migration API directly here.

const env = process.env.NODE_ENV || 'development';
const {connection: connectionSettings, client} = knexfile[env];
const {host, database, user, password} = connectionSettings;

function createConfigForDatabaseName(databaseName) {
    return {
        client,
        connection: {
            host,
            user,
            password,
            database: databaseName
        }
    };
}

const postgresKnex = knex(createConfigForDatabaseName('postgres'));
Promise.resolve()
    .then(() => {
        // Check if database exists.
        return postgresKnex('pg_database')
            .select()
            .where({
                datname: database
            })
            .then((databases) => databases.length > 0)
    })
    .then((databaseExists) => {
        if (!databaseExists) {
            console.log(`Database ${database} doesn't exist, create...`);
            return postgresKnex.raw(`CREATE DATABASE ${database}`)
                .then(() => {
                    console.log(`Database ${database} is created.`);
                    return true;
                });
        } else {
            console.log(`Database ${database} exists.`);
            return false;
        }
    })
    .then(() => {
        console.log('Destroying "postgres" database context.');
        return postgresKnex.destroy();
    })
    .then(() => knex(createConfigForDatabaseName(database)))
    .then((knex) => {
        return knex.migrate.latest({directory: __dirname + '/../migrations'})
            .then(() => knex);
    })
    .then((knex) => {
        console.log('Destroying database context');
        return knex.destroy();
    })
    .then(() => {
        console.log('Completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
