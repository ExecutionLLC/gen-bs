'use strict';

/**
 * This file contains global hooks for all test suits.
 * */

const MockHost = require('./mocks/MockHost');

var regServer = new MockHost();
const START_TIMEOUT = 5000;

// Store web server as a global variable.
global.regServer = regServer;

before(function(done) {
    this.timeout(10000);
    regServer.startAsync()
        .then(() => {
            console.log('Mock server is started, waiting for ' + START_TIMEOUT + ' ms for it to complete loading...');
            setTimeout(done, START_TIMEOUT);
        })
        .catch((error) => {
            throw new Error(error)
        });
});

after((done) => {
    regServer.stopAsync()
        .then(() => {
            console.log('Mock server is stopped successfully.');
            done();
        })
        .catch((error) => {
            throw new Error(error);
        });
});
