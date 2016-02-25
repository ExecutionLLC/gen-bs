'use strict';

const assert = require('assert');
const _ = require('lodash');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const DataClient = require('./utils/DataClient');

const DefaultFilters = require('../defaults/filters/default-filters.json');
const DefaultViews = require('../defaults/views/default-views.json');

const languId = Config.defaultLanguId;

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const dataClient = new DataClient(urls);

const closeSessionWithCheck = (sessionId, done) => {
    sessionsClient.closeSession(sessionId, (error, response) => {
        assert.ifError(error);
        const closedSessionId = SessionsClient.getSessionFromResponse(response);
        assert.equal(closedSessionId, sessionId);
        done();
    });
};

describe('Demo Users', () => {
    describe('Open/close demo session', () => {
        let sessionId = null;

        it('should open demo session by default', (done) => {
            sessionsClient.openSession(null, (error, response) => {
                assert.ifError(error);
                sessionId = SessionsClient.getSessionFromResponse(response);
                done();
            });
        });

        it('should close demo session', (done) => {
            closeSessionWithCheck(sessionId, done);
        });
    });

    describe('Demo data retrieval', () => {
        let sessionId = null;

        before((done) => {
            sessionsClient.openSession(null, (error, response) => {
                assert.ifError(error);
                sessionId = SessionsClient.getSessionFromResponse(response);
                done();
            });
        });

        after(done => {
            closeSessionWithCheck(sessionId, done);
        });

        it('should get demo user data', (done) => {
            dataClient.getUserData(sessionId, languId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const body = response.body;

                // No session operations.
                const operations = body.activeOperations;
                assert.ok(_.isEmpty(operations), 'There should be no operations for the newly created demo session');

                // Only default filters.
                const filters = body.filters;
                assert.ok(!_.isEmpty(filters));
                assert.ok(filters.length === DefaultFilters.length);
                _.each(filters, filter => {
                    assert.ok(_.includes(['standard', 'advanced'], filter.type),
                        'There should be no filter types except "standard" and "advanced", but got ' + filter.type);
                });

                // Only default views.
                const views = body.views;
                assert.ok(!_.isEmpty(views));
                assert.ok(views.length === DefaultViews.length);
                _.each(views, view => {
                    assert.ok(_.includes(['standard', 'advanced'], view.type),
                        'There should be no view types except "standard" and "advanced", but got ' + view.type);
                });

                // Only default samples.
                const samples = body.samples;
                assert.ok(!_.isEmpty(samples));
                _.each(samples, sample => {
                    assert.ok(_.includes(['standard', 'advanced'], sample.type),
                        'There should be no sample types except "standard" and "advanced", but got ' + sample.type);
                });

                done();
            });
        });
    });
});