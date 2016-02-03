'use strict';

const async = require('async');

/**
 * NPM script is used to build initial data and add it to the database (later).
 * */
const sampleBuilder = require('./SampleAndSourceBuilder');
const keywordsBuilder = require('./KeywordsBuilder');
const viewsBuilder = require('./ViewBuilder');
const filtersBuilder = require('./FilterBuilder');

function displayErrorAndExitProcess(error) {
    if (error) {
        console.error(error);
        process.exit(1);
    }
}

async.waterfall([
    (callback) => {
        sampleBuilder.build(callback);
    },
    (callback) => {
        keywordsBuilder.build(callback);
    },
    (callback) => {
        viewsBuilder.build(callback);
    },
    (callback) => {
        filtersBuilder.build(callback);
    },
    () => {
        console.log('Generation completed.');
        process.exit(0);
    }
], (error) => {
    displayErrorAndExitProcess(error);
});
