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
    regServer.start((error) => {
        if (error) {
            throw new Error(error);
        } else {
            console.log('Mock server is started, waiting for ' + START_TIMEOUT + ' ms for it to complete loading...');
            setTimeout(done, START_TIMEOUT);
        }
    });
});

after((done) => {
    regServer.stop((error) => {
        if (error) {
            throw new Error(error);
        } else {
            console.log('Mock server is stopped successfully.');
            done();
        }
    })
});
