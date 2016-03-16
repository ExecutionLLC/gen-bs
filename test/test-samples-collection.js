'use strict';

const assert = require('assert');
const _ = require('lodash');
const fs = require('fs');

const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const SamplesClient = require('./utils/SamplesClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const CollectionUtils = require('./utils/CollectionUtils');
const WebSocketClient = require('./utils/WebSocketClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const samplesClient = new SamplesClient(urls);

const TestUser = require('./mocks/mock-users.json')[1];

describe('Samples Collection', function() {
    let sessionId = null;
    let webSocketClient = null;

    before((done) => {
        sessionsClient.openSession(TestUser.email, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response, true, true);

            webSocketClient = new WebSocketClient('localhost', Config.port);
            console.log('Waiting for the socket client to init...');
            setTimeout(() => {
                webSocketClient.associateSession(sessionId);
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

    it('should list all samples', (done) => {
        samplesClient.getAll(sessionId, (error, response) => {
            const samples = ClientBase.readBodyWithCheck(error, response);
            assert.ok(samples && samples.length);
            CollectionUtils.checkCollectionIsValid(samples, null, false);

            _.each(samples, sample => SamplesClient.verifySampleFormat(sample, false));

            done();
        });
    });

    it('should correctly upload sample', (done) => {
        const sampleFileName = 'Sample_vcf4.1_custom_field.vcf.gz';
        const sampleFileStream = fs.createReadStream(__dirname + '/mocks/' + sampleFileName);
        const wsState = {
            operationId: null
        };

        webSocketClient.onMessage((message) => {
            console.log('Upload Message: ', message);
            assert.equal(message.operationId, wsState.operationId);
            const result = message.result;
            if (result && result.status === 'ready') {
                assert.equal(result.progress, 100);

                const sampleId = result.sampleId;
                assert.ok(sampleId);

                samplesClient.get(sessionId, sampleId, (error, response) => {
                    const sampleMetadata = ClientBase.readBodyWithCheck(error, response);
                    SamplesClient.verifySampleFormat(sampleMetadata, true);
                    assert.equal(sampleMetadata.fileName, sampleFileName);

                    done();
                });
            } else if (result.error) {
                assert.fail(result.error);
            }
        });

        samplesClient.add(sessionId, sampleFileName, sampleFileStream, (error, response) => {
            const body = ClientBase.readBodyWithCheck(error, response);
            wsState.operationId = body.operationId;
        });
    });
});
