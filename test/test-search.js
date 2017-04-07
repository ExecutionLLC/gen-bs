'use strict';

const assert = require('assert');
const _ = require('lodash');

const ClientBase = require('./utils/ClientBase');
const CollectionUtils = require('../utils/CollectionUtils');
const SessionsClient = require('./utils/SessionsClient');
const FiltersClient = require('./utils/FiltersClient');
const ViewsClient = require('./utils/ViewsClient');
const ModelsClient = require('./utils/ModelsClient');
const SamplesClient = require('./utils/SamplesClient');
const SearchClient = require('./utils/SearchClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const WebSocketClient = require('./utils/WebSocketClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const filtersClient = new FiltersClient(urls);
const viewsClient = new ViewsClient(urls);
const modelsClient = new ModelsClient(urls);
const samplesClient = new SamplesClient(urls);
const searchClient = new SearchClient(urls);

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};

describe('Search', function () {
    // Search should fit into 60 seconds
    this.timeout(60000);
    let sessionId = null;
    let webSocketClient = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            webSocketClient = new WebSocketClient('localhost', Config.port);
            console.log('Waiting for the socket client to init...');
            setTimeout(() => {
                webSocketClient.associateSessionIdAndUserId(sessionId);

                done();
            }, 3000);
        });
    });

    beforeEach(() => {
        webSocketClient.onError(null);
        webSocketClient.onMessage(null);
    });

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
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
                const {header, data} = endMessage.result;
                const allFields = wsState.sourcesFields.concat(wsState.sampleFields);

                const fieldIdToMetadata = CollectionUtils.createHashByKey(allFields, 'id');

                // Check that data are received.
                assert.ok(data.length);

                // Check that all field ids from the data header lay either in sample or in source fields.
                _.each(header, head => {
                    const fieldId = head.fieldId;
                    assert.ok(fieldId);
                    assert.ok(fieldIdToMetadata[fieldId], 'Field ' + fieldId + ' is not found!');
                });

                _.each(data, row => {
                    assert.ok(row.comments);
                    assert.ok(row.searchKey);
                });

                done();
            }
        });

        webSocketClient.onError((error) => {
            wsState.error = error;
        });

        filtersClient.getAll(sessionId, (error, response) => {
            const filters = ClientBase.readBodyWithCheck(error, response);

            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                modelsClient.getAll(sessionId, (error, response) => {
                    const models = ClientBase.readBodyWithCheck(error, response);

                    samplesClient.getAll(sessionId, (error, response) => {
                        const samples = ClientBase.readBodyWithCheck(error, response);
                        const sample = samples[0];

                        samplesClient.getFields(sessionId, sample.id, (error, response) => {
                            const sampleFields = ClientBase.readBodyWithCheck(error, response);

                            samplesClient.getSourcesFields(sessionId, (error, response) => {
                                const sourcesFields = ClientBase.readBodyWithCheck(error, response);

                                wsState.filter = filters[0];
                                wsState.view = views[0];
                                wsState.sample = sample;
                                wsState.sourcesFields = sourcesFields;
                                wsState.sampleFields = sampleFields;
                                const analysis = {
                                    id: null,
                                    text: [
                                        {
                                            languageId: null,
                                            name: 'test name',
                                            description: 'test_descr'
                                        }
                                    ],
                                    type: 'single',
                                    samples: [
                                        {
                                            id: sample.id,
                                            type: 'single'
                                        }
                                    ],
                                    viewId: views[0].id,
                                    filterId: filters[0].id,
                                    modelId: models[0].id
                                };

                                searchClient.sendSearchRequest(sessionId, Config.defaultLanguId, analysis, wsState.limit, wsState.offset,
                                    (error, response) => {
                                        const body = ClientBase.readBodyWithCheck(error, response);
                                        const operationId = body.operationId;
                                        assert.ok(operationId);
                                        wsState.operationId = operationId;
                                    });
                            });
                        });
                    });
                });
            });
        });
    });
});
