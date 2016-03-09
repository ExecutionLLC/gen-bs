'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const ClientBase = require('./utils/ClientBase');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);

describe('Saved Files', () => {
    it('should correctly upload exported file', (done) => {
        assert.fail('Not implemented');
    });
});
