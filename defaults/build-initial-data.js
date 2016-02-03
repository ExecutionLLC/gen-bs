'use strict';

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

sampleBuilder.build((error) => {
    displayErrorAndExitProcess(error);
    keywordsBuilder.build((error) => {
        displayErrorAndExitProcess(error);
        viewsBuilder.build((error) => {
            displayErrorAndExitProcess(error);
            filtersBuilder.build((error) => {
                displayErrorAndExitProcess(error);
                console.log('Generation completed.');
            });
        });
    });
});
