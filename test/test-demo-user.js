'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');

const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const DataClient = require('./utils/DataClient');
const FiltersClient = require('./utils/FiltersClient');
const ViewsClient = require('./utils/ViewsClient');
const SamplesClient = require('./utils/SamplesClient');
const CollectionUtils = require('./utils/CollectionUtils');

const languId = Config.defaultLanguId;

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const viewsClient = new ViewsClient(urls);
const filtersClient = new FiltersClient(urls);
const samplesClient = new SamplesClient(urls);

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

    describe('Collection operations', () => {
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

        it('should be able to get filters', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                CollectionUtils.checkCollectionIsValid(filters, null, true, true);

                done();
            });
        });

        it('should be able to get views', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                CollectionUtils.checkCollectionIsValid(views, null, true, true);

                done();
            })
        });

        it('should be able to get samples', (done) => {
            samplesClient.getAll(sessionId, (error, response) => {
                const samples = ClientBase.readBodyWithCheck(error, response);
                assert.ok(samples);
                CollectionUtils.checkCollectionIsValid(samples, null, true, true);

                done();
            });
        });

        it('should fail to create view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                const originalView = views[0];
                const viewToUpdate = _.cloneDeep(originalView);
                viewToUpdate.id = null;
                viewToUpdate.text = [
                    {
                        languageId: null,
                        name: 'Test view ' + Uuid.v4(),
                        description: ''
                    }
                ];
                viewsClient.add(sessionId, languId, viewToUpdate, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            })
        });

        it('should fail to create filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                const originalFilter = filters[0];
                const filterToUpdate = _.cloneDeep(originalFilter);
                filterToUpdate.id = null;
                filterToUpdate.text = [
                    {
                        languageId: null,
                        name: 'Test filter' + Uuid.v4(),
                        description: ''
                    }
                ];
                filtersClient.add(sessionId, languId, filterToUpdate, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            })
        });
    });
});