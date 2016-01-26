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
            webSocketClient.associateSession(sessionId);
            done();
        });
    });

    beforeEach(() => {
        webSocketClient.onError(null);
        webSocketClient.onMessage(null);
    });

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            assert.ifError(error);
            assert.equal(response.status, HttpStatus.OK);
            done();
        });
    });

    it('should correctly send search request', (done) => {
        const wsState = {
            operationId: null,
            messages: [],
            error: null,
            sample: null,
            view: null,
            filter: null,
            sourcesFields: null,
            sampleFields: null,
            limit: 100,
            offset: 0
        };

        webSocketClient.onMessage((message) => {
            // Here is the web socket response analysis.
            wsState.messages.push(message);
            assert.equal(message.operationId, wsState.operationId);
            const endMessage = _.find(wsState.messages, (message) => message
                && message.result
                && message.result.data
                && _.isArray(message.result.data));
            if (endMessage) {
                const rows = endMessage.result.data;
                const allFields = wsState.sourcesFields.concat(wsState.sampleFields);

                const fieldIdToMetadata = _.indexBy(allFields, 'id');

                // Check that all field ids from the data lay either in sample or in source fields.
                _.each(rows, row => {
                    _(row)
                        .keys()
                        .each((key) => {
                            assert.ok(fieldIdToMetadata[key], 'Field ' + key + ' is not found!');
                        });
                });

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
                    const sample = samples[0];

                    samplesClient.getFields(sessionId, sample.id, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);
                        const sampleFields = response.body;
                        samplesClient.getSourcesFields(sessionId, (error, response) => {
                            assert.ifError(error);
                            assert.equal(response.status, HttpStatus.OK, response.body);
                            const sourcesFields = response.body;

                            wsState.filter = filters[0];
                            wsState.view = views[0];
                            wsState.sample = sample;
                            wsState.sourcesFields = sourcesFields;
                            wsState.sampleFields = sampleFields;

                            searchClient.sendSearchRequest(sessionId, wsState.sample.id, wsState.view.id, wsState.filter.id, wsState.limit, wsState.offset, (error, response) => {
                                assert.ifError(error);
                                const operationId = response.body.operationId;
                                assert.ok(operationId, JSON.stringify(response.body));
                                wsState.operationId = operationId;
                            });
                        });
                    });
                });
            });
        });
    });
});
