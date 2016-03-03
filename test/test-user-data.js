'use strict';

const assert = require('assert');
const _ = require('lodash');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const DataClient = require('./utils/DataClient');
const CollectionUtils = require('./utils/CollectionUtils');

const TestUser = require('./mocks/mock-users.json')[1];

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const dataClient = new DataClient(urls);

const languId = Config.defaultLanguId;
const DefaultFilters = require('../defaults/filters/default-filters.json');
const DefaultViews = require('../defaults/views/default-views.json');

describe('User Data', () => {
    let sessionId = null;
    let demoSessionId = null;
    before((done) => {
        sessionsClient.openSession(TestUser.email, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
            sessionId = SessionsClient.getSessionFromResponse(response);

            sessionsClient.openSession(null, (error, response) => {
                ClientBase.readBodyWithCheck(error, response);
                demoSessionId = SessionsClient.getSessionFromResponse(response);
            });

            done();
        });
    });

    it('should get user data in appropriate format', (done) => {
        dataClient.getUserData(sessionId, languId, (error, response) => {
            const body = ClientBase.readBodyWithCheck(error, response);

            const profile = body.profileMetadata;
            assert.ok(profile);
            assert.equal(profile.email, TestUser.email);
            assert.equal(profile.name, TestUser.name);
            assert.equal(profile.id, TestUser.id);

            // No session operations.
            const operations = body.activeOperations;
            assert.ok(_.isEmpty(operations), 'There should be no operations for the newly created demo session');

            // Only default filters.
            const filters = body.filters;
            CollectionUtils.checkCollectionIsValid(filters, null, false);

            // Only default views.
            const views = body.views;
            CollectionUtils.checkCollectionIsValid(views, null, false);

            // Only default samples.
            const samples = body.samples;
            CollectionUtils.checkCollectionIsValid(samples, null, false);

            done();
        });
    });

    it('should get demo user data', (done) => {
        dataClient.getUserData(demoSessionId, languId, (error, response) => {
            const body = ClientBase.readBodyWithCheck(error, response);

            // No session operations.
            const operations = body.activeOperations;
            assert.ok(_.isEmpty(operations), 'There should be no operations for the newly created demo session');

            // Only default filters.
            const filters = body.filters;
            CollectionUtils.checkCollectionIsValid(filters, DefaultFilters, true);

            // Only default views.
            const views = body.views;
            CollectionUtils.checkCollectionIsValid(views, DefaultViews, true);

            // Only default samples.
            const samples = body.samples;
            CollectionUtils.checkCollectionIsValid(samples, null, true);

            done();
        });
    });
});
