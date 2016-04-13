'use strict';

const assert = require('assert');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const QueryHistoryClient = require('./utils/QueryHistoryClient');
const SearchClient = require('./utils/SearchClient');
const DataClient = require('./utils/DataClient');


const TestUser = require('./mocks/mock-users.json')[1];

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);

const historyClient = new QueryHistoryClient(urls);
const searchClient = new SearchClient(urls);
const dataClient = new DataClient(urls);

const languageId = Config.defaultLanguId;


describe('Query History', () => {
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

    after((done) => {
        sessionsClient.closeSession(demoSessionId, (error, response) => {
            SessionsClient.getSessionFromResponse(response, false, false);

            sessionsClient.closeSession(sessionId, (error, response) => {
                SessionsClient.getSessionFromResponse(response, false, false);

                done();
            });
        });
    });

    it('should get last user queryHistory', (done) => {
        dataClient.getUserData(sessionId, languageId, (error, response) => {
            const body = ClientBase.readBodyWithCheck(error, response);

            const testFilter = body.filters[0];
            const testView = body.views[0];
            const testSample = body.samples[0];

            searchClient.sendSearchRequest(sessionId, Config.defaultLanguId, testSample.id,
                testView.id, testFilter.id, 1, 0,
                (error, response) => {
                    const body = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(body.operationId);
                    historyClient.getClientQueryHistory(sessionId, 1, 0, (error, response) => {
                        const body = ClientBase.readBodyWithCheck(error, response);
                        // The last entry should not be returned.
                        assert.equal(body.result.length, 0, 'Unexpected history length');
                        const resultQuery = body.result[0];
                        assert.equal(resultQuery.sample.id, testSample.id, 'Sample id is not equal');
                        assert.equal(resultQuery.view.id, testView.id, 'View id is not equal');
                        assert.equal(resultQuery.filters[0].id, testFilter.id, 'Filters id is not equal');

                        done();
                    });
                });
        });

    });
});
