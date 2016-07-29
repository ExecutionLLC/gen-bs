'use strict';

/**
 * This file contains global hooks for all test suits.
 * */

const MockHost = require('./mocks/MockHost');

const webServer = new MockHost();
const START_TIMEOUT = 5000;

before(function(done) {
    this.timeout(10000);
    webServer.start((error) => {
        if (error) {
            throw new Error(error);
        } else {
            console.log('Mock server is started, waiting for ' + START_TIMEOUT + ' ms for it to complete loading...');
            setTimeout(done, START_TIMEOUT);
        }
    });
});

after((done) => {
    webServer.stop((error) => {
        if (error) {
            throw new Error(error);
        } else {
            console.log('Mock server is stopped successfully.');
            done();
        }
    })
});
