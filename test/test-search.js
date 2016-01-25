'use strict';

const assert = require('assert');
const _ = require('lodash');
const HttpStatus = require('http-status');

const SessionsClient = require('./utils/SessionsClient');
const FiltersClient = require('./utils/FiltersClient');
const ViewsClient = require('./utils/ViewsClient');
const SamplesClient = require('./utils/SamplesClient');
const SearchClient = require('./utils/SearchClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const WebSocketClient = require('./utils/WebSocketClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const filtersClient = new FiltersClient(urls);
const viewsClient = new ViewsClient(urls);
const samplesClient = new SamplesClient(urls);
const searchClient = new SearchClient(urls);
const webSocketClient = new WebSocketClient('localhost', Config.port);

const TestUser = {
    userName: 'valarie',
    password: 'password'
};

describe('Search', () => {
    let sessionId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    beforeEach(() => {
        webSocketClient.onError(null);
        webSocketClient.onMessage(null);
    });

    it('should correctly send search request', (done) => {
        const wsState = {
            messages: [],
            error: null
        };

        webSocketClient.onMessage((message) => {
            wsState.messages.push(JSON.parse(message));
            if (_.any(wsState.messages, (message) => message
                && message.result
                && message.result.data
                && _.isArray(message.result.data))) {
                done();
            }
        });

        webSocketClient.onError((error) => {
            wsState.error = error;
        });

        filtersClient.getAll(sessionId, (error, response) => {
            assert.ifError(error);
            assert.equal(response.status, HttpStatus.OK);
            const filters = response.body;
            viewsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const views = response.body;
                samplesClient.getAll(sessionId, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const samples = response.body;

                    const filter = filters[0];
                    const view = views[0];
                    const sample = samples[0];

                    searchClient.sendSearchRequest(sessionId, sample.id, view.id, filter.id, (error, response) => {
                        assert.ifError(error);
                        wsState.operationId = response.body.operationId;
                    });
                });
            });
        });
    });
});
