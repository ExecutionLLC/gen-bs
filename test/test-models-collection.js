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

const UnknownModelId = Uuid.v4();

const checkModel = (model) => {
    const modelText = model.text[0];
    assert.ok(model.id);
    assert.ok(modelText.name);
    assert.ok(
        _.some(ENTITY_TYPES.allValues, (type) => model.type === type)
    );
    assert.ok(
        _.some(MODEL_TYPES.allValues, (type) => model.modelType === type)
    );
    assert.ok(
        _.some(ANALYSIS_TYPES.allValues, (type) => model.analysisType === type)
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

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
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

        it('should get existing model', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const firstModel = models[0];

                modelsClient.get(sessionId, firstModel.id, (error, response) => {
                    const model = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(model);
                    checkModel(model);
                    done();
                });
            });
        });

        it('should create and update existing user model', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: 'Test Model ' + Uuid.v4(),
                        description: ''
                    }
                ];

                modelsClient.add(sessionId, languId, model, (error, response) => {
                    const addedModel = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedModel);
                    assert.notEqual(addedModel.id, model.id, 'Model id is not' +
                        ' changed.');
                    assert.equal(addedModel.text[0].name, model.text[0].name);
                    assert.equal(addedModel.type, ENTITY_TYPES.USER);

                    // Update created filter.
                    const modelToUpdate = _.cloneDeep(addedModel);
                    modelToUpdate.type = ENTITY_TYPES.ADVANCED;

                    modelsClient.update(sessionId, modelToUpdate, (error, response) => {
                        const updatedModel = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(updatedModel);
                        assert.notEqual(updatedModel.id, modelToUpdate.id);
                        assert.equal(updatedModel.type, ENTITY_TYPES.USER, 'Model type change should not be allowed by update.');
                        done();
                    });
                });
            });
        });

    });

    describe('failure tests', () => {
        it('should fail to update or delete non-user model', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const nonUserModel = _.find(models, model => model.type !== ENTITY_TYPES.USER);
                assert.ok(nonUserModel, 'Cannot find any non-user model');
                nonUserModel.text = [
                    {
                        languageId: null,
                        name: 'Test Name' + Uuid.v4(),
                        description: ''
                    }
                ];
                modelsClient.update(sessionId, nonUserModel, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    modelsClient.remove(sessionId, nonUserModel.id, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);

                        done();
                    });
                });
            });
        });

        it('should not fail to get and fail to update deleted user model', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const models = response.body;
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: 'Test Model ' + Uuid.v4(),
                        description: Uuid.v4()
                    }
                ];
                modelsClient.add(sessionId, languId, model, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedModel = response.body;
                    assert.ok(addedModel);
                    assert.equal(addedModel.text[0].name, model.text[0].name);
                    assert.equal(addedModel.text[0].description, model.text[0].description);

                    // Delete created filter
                    modelsClient.remove(sessionId, addedModel.id, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);

                        // It should not return with all user filters.
                        modelsClient.getAll(sessionId, (error, response) => {
                            const models = ClientBase.readBodyWithCheck(error, response);
                            assert.ok(!_.some(models, f => f.id == addedModel.id));

                            // It should be possible to retrieve it by id (history support).
                            modelsClient.get(sessionId, addedModel.id, (error, response) => {
                                assert.ifError(error);
                                assert.equal(response.status, HttpStatus.OK);

                                // It should fail to update removed filter.
                                const modelToUpdate = _.cloneDeep(addedModel);
                                model.text = [
                                    {
                                        languageId: null,
                                        name: 'Test Model ' + Uuid.v4(),
                                        description: ''
                                    }
                                ];

                                modelsClient.update(sessionId, modelToUpdate, (error, response) => {
                                    ClientBase.expectErrorResponse(error, response);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should fail to create model with empty name', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: '',
                        description: ''
                    }
                ];
                modelsClient.add(sessionId, languId, model, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                })
            })
        });

        it('should fail to add model with existing name', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: model.text[0].name,
                        description: ''
                    }
                ];
                modelsClient.add(sessionId, languId, model, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to add model with existing name with leading and' +
            ' trailing spaces', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                const models = ClientBase.readBodyWithCheck(error, response);
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: ' ' + model.text[0].name + ' ',
                        description: ''
                    }
                ];
                modelsClient.add(sessionId, languId, model, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to get unknown model', (done) => {
            modelsClient.get(sessionId, UnknownModelId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            });
        });

        it('should not return previous version of the filter when current version is deleted (issue #337)', (done) => {
            modelsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const models = response.body;
                assert.ok(models);
                const model = models[0];
                model.text = [
                    {
                        languageId: null,
                        name: 'Test Model ' + Uuid.v4(),
                        description: Uuid.v4()
                    }
                ];

                modelsClient.add(sessionId, languId, model, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedModel = response.body;
                    assert.ok(addedModel);
                    assert.equal(addedModel.text[0].name, model.text[0].name);
                    assert.equal(addedModel.text[0].description, model.text[0].description);

                    // Now it should return.
                    modelsClient.getAll(sessionId, (error, response) => {
                        const models = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(_.some(models, f => f.id === addedModel.id));
                        assert.ok(_.some(models, f => f.text[0].description === model.text[0].description));

                        const modelToUpdate = Object.assign({}, addedModel, {
                            text: [
                                {
                                    languageId: null,
                                    name: Uuid.v4(),
                                    description: addedModel.text[0].description
                                }
                            ]
                        });

                        // Make new version.
                        modelsClient.update(sessionId, modelToUpdate, (error, response) => {
                            const updatedModel = ClientBase.readBodyWithCheck(error, response);

                            // Delete the last version.
                            modelsClient.remove(sessionId, updatedModel.id, (error, response) => {
                                ClientBase.readBodyWithCheck(error, response);

                                modelsClient.getAll(sessionId, (error, response) => {
                                    // Now filters list should not return the filter.
                                    const models = ClientBase.readBodyWithCheck(error, response);
                                    assert.ok(!_.some(models, f => f.text[0].description === model.text[0].description));

                                    done();
                                });
                            })
                        })
                    });
                });
            });
        });
    });
});