'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const {ENTITY_TYPES} = require('../utils/Enums');
const {MODEL_TYPES} = require('../utils/Enums');
const {ANALYSIS_TYPES} = require('../utils/Enums');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const ModelsClient = require('./utils/ModelsClient');
const ClientBase = require('./utils/ClientBase');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const modelsClient = new ModelsClient(urls);

const languId = Config.defaultLanguId;

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};


const checkModel = (model) => {
    assert.ok(model.id);
    assert.ok(model.name);
    assert.ok(
        _.any(ENTITY_TYPES.allValues, (type) => model.type === type)
    );
    assert.ok(
        _.any(MODEL_TYPES.allValues, (type) => model.modelType === type)
    );
    assert.ok(
        _.any(ANALYSIS_TYPES.allValues, (type) => model.analysisType === type)
    );
};

describe('Model', () => {
    let sessionId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    describe('positive tests', () => {
        it('should get all models', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                assert.ok(Array.isArray(models));
                _.each(models, filter => checkModel(filter));
                done();
            });
        });
    });
});