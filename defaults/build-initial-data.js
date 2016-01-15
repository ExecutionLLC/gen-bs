'use strict';

/**
 * NPM script is used to build initial data and add it to the database (later).
 * */
const sampleBuilder = require('./SampleAndSourceBuilder');
const viewsBuilder = require('./ViewBuilder');

function displayErrorAndExitProcess(error) {
    if (error) {
        console.error(error);
        process.exit(1);
    }
}

sampleBuilder.build((error) => {
    displayErrorAndExitProcess(error);
    viewsBuilder.build((error) => {
        displayErrorAndExitProcess(error);
        console.log('Generation completed.');
    });
});
