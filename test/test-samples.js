'use strict';

const assert = require('assert');
const _ = require('lodash');

const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const SamplesClient = require('./utils/SamplesClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const CollectionUtils = require('./utils/CollectionUtils');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const samplesClient = new SamplesClient(urls);

const TestUser = require('./mocks/mock-users.json')[1];

describe('Samples', function() {
    let sessionId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);

            done();
        });
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

    describe('One sample', () => {
        let sampleId = null;

        before((done) => {
            samplesClient.getAll(sessionId, (error, response) => {
                const samples = ClientBase.readBodyWithCheck(error, response);
                sampleId = samples[0].id;

                done();
            });
        });

        it('should get metadata for one sample', (done) => {
            samplesClient.get(sessionId, sampleId, (error, response) => {
                const sample = ClientBase.readBodyWithCheck(error, response);
                SamplesClient.verifySampleFormat(sample, true);

                done();
            });
        });

        it('should get sample fields', (done) => {
            samplesClient.get(sessionId, sampleId, (error, response) => {
                const sample = ClientBase.readBodyWithCheck(error, response);

                samplesClient.getFields(sessionId, sampleId, (error, response) => {
                    const sampleFields = ClientBase.readBodyWithCheck(error, response);

                    SamplesClient.verifySampleFields(sampleFields, sample);
                    done();
                });
            });

        });
    });
});
