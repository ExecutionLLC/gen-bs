'use strict';

const assert = require('assert');
const _ = require('lodash');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const SamplesClient = require('./utils/SamplesClient');
const DataClient = require('./utils/DataClient');
const CollectionUtils = require('./utils/CollectionUtils');

const TestUser = require('./mocks/mock-users.json')[1];

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const dataClient = new DataClient(urls);

const languId = Config.defaultLanguId;

const checkUserData = (userData, isDemoUser, callback) => {
    if (!isDemoUser) {
        const profile = userData.profileMetadata;
        assert.ok(profile);
        assert.equal(profile.email, TestUser.email);
        assert.equal(profile.name, TestUser.name);
        assert.equal(profile.id, TestUser.id);
    }

    // Empty list of uploads.
    const uploads = userData.uploads;
    assert.ok(_.isEmpty(uploads));

    // Empty list of active uploads.
    const activeUploads = userData.activeUploads;
    assert.ok(_.isEmpty(activeUploads));

    // Only default filters.
    const filters = userData.filters;
    CollectionUtils.checkCollectionIsValid(filters, null, false, true);

    // Only default views.
    const views = userData.views;
    CollectionUtils.checkCollectionIsValid(views, null, false, true);

    // Only default samples.
    const samples = userData.samples;
    CollectionUtils.checkCollectionIsValid(samples, null, false, true);

    const totalFields = userData.totalFields;
    CollectionUtils.checkCollectionIsValid(totalFields, null, false, false);

    const models = userData.models;
    CollectionUtils.checkCollectionIsValid(models, null, false, true);

    _.each(samples, sample => SamplesClient.verifySampleFormat(sample, false));

    assert.ok(userData.savedFiles);

    callback();
};

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

                done();
            });
        });
    });

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);

            sessionsClient.closeSession(demoSessionId, (error, response) => {
                ClientBase.readBodyWithCheck(error, response);

                done();
            });
        })
    });

    it('should get user data in appropriate format', (done) => {
        dataClient.getUserData(sessionId, languId, (error, response) => {
            const userData = ClientBase.readBodyWithCheck(error, response);

            checkUserData(userData, false, () => {
                done();
            });
        });
    });

    it('should get demo user data', (done) => {
        dataClient.getUserData(demoSessionId, languId, (error, response) => {
            const userData = ClientBase.readBodyWithCheck(error, response);

            checkUserData(userData, true, () => {

                done();
            });
        });
    });
});
