'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const {ENTITY_TYPES} = require('../utils/Enums');
const Urls = require('./utils/Urls');
const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const ViewsClient = require('./utils/ViewsClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const viewsClient = new ViewsClient(urls);

const languId = Config.defaultLanguId;

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};

const UnknownViewId = Uuid.v4();
const UnknownSessionId = Uuid.v4();

const checkView = (view) => {
    assert.ok(view.id);
    assert.ok(view.name);
    assert.ok(
        _.includes(ENTITY_TYPES.allValues, view.type)
    );
    assert.ok(view.viewListItems);
};

describe('Views', () => {
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
        it('should get all views', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                assert.ok(Array.isArray(views));
                _.each(views, view => checkView(view));
                done();
            });
        });

        it('should get existing view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const firstView = views[0];

                viewsClient.get(sessionId, firstView.id, (error, response) => {
                    const view = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(view);
                    checkView(view);
                    done();
                });
            });
        });

        it('should create and update existing user view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    const addedView = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedView);
                    assert.notEqual(addedView.id, view.id, 'View id is not changed.');
                    assert.equal(addedView.name, view.name);
                    assert.equal(addedView.type, ENTITY_TYPES.USER);

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.type = ENTITY_TYPES.ADVANCED;

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        const updatedView = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(updatedView);
                        assert.notEqual(updatedView.id, viewToUpdate.id);
                        assert.equal(updatedView.type, ENTITY_TYPES.USER, 'View type change should not be allowed by update.');
                        done();
                    });
                });
            });
        });
    });

    describe('failure tests', () => {
        it('should fail to update and remove non-user view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const nonUserView = _.find(views, view => view.type !== ENTITY_TYPES.USER);
                assert.ok(nonUserView, 'Cannot find any non-user view');
                nonUserView.name = 'Test Name' + Uuid.v4();

                viewsClient.update(sessionId, nonUserView, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    viewsClient.remove(sessionId, nonUserView, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);

                        done();
                    });
                });
            });
        });

        it('should not fail to get and fail to update deleted user view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const views = response.body;
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedView = response.body;
                    assert.ok(addedView);

                    // Delete created view
                    viewsClient.remove(sessionId, addedView.id, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);

                        viewsClient.get(sessionId, addedView.id, (error, response) => {
                            assert.ifError(error);
                            assert.equal(response.status, HttpStatus.OK);

                            // Trying to update created view.
                            const viewToUpdate = _.cloneDeep(addedView);
                            viewToUpdate.name = 'Test View ' + Uuid.v4();

                            viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                                assert.ifError(error);
                                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should fail to get list in incorrect session', (done) => {
            viewsClient.getAll(UnknownSessionId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            })
        });

        it('should fail to get unknown view', (done) => {
            viewsClient.get(sessionId, UnknownViewId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            });
        });

        it('should fail to add view with list item containing field_id=null', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();
                const viewItem = view.viewListItems[0];
                viewItem.fieldId = null;
                view.viewListItems.push(viewItem);

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);
                    done();
                });
            });
        });

        it('should fail to add view with empty name', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = '';

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to add view with existing name', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to add view with existing name with leading and trailing spaces', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = ' ' + view.name + ' ';

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to add view with empty list item', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();
                view.viewListItems = [];

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);
                    done();
                });
            });
        });

        it('should fail to update view with list item containing field_id=null', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    const addedView = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedView);
                    assert.notEqual(addedView.id, view.id, 'View id is not changed.');
                    assert.equal(addedView.name, view.name);
                    assert.equal(addedView.type, ENTITY_TYPES.USER);

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = ENTITY_TYPES.ADVANCED;
                    const viewItem = viewToUpdate.viewListItems[0];
                    viewItem.fieldId = null;
                    viewToUpdate.viewListItems.push(viewItem);

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);
                        done();
                    });
                });
            });
        });

        it('should fail to update view with empty list item', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    const addedView = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedView);
                    assert.notEqual(addedView.id, view.id, 'View id is not changed.');
                    assert.equal(addedView.name, view.name);
                    assert.equal(addedView.type, ENTITY_TYPES.USER);

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = ENTITY_TYPES.ADVANCED;
                    viewToUpdate.viewListItems = [];

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);
                        done();
                    });
                });
            });
        });

        it('should not return previous version of the view when current version is deleted (issue #337)', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const view = views[0];
                view.name = 'Test View ' + Uuid.v4();
                // Will search the view by description below.
                view.description = Uuid.v4();

                viewsClient.add(sessionId, languId, view, (error, response) => {
                    const addedView = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedView);
                    assert.equal(addedView.name, view.name);
                    assert.equal(addedView.description, view.description);

                    // Now it should return.
                    viewsClient.getAll(sessionId, (error, response) => {
                        const views = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(_.some(views, f => f.id === addedView.id));
                        assert.ok(_.some(views, f => f.description === view.description));

                        const viewToUpdate = Object.assign({}, addedView, {
                            name: Uuid.v4()
                        });

                        // Make new version.
                        viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                            const updatedView = ClientBase.readBodyWithCheck(error, response);

                            // Delete the last version.
                            viewsClient.remove(sessionId, updatedView.id, (error, response) => {
                                ClientBase.readBodyWithCheck(error, response);

                                viewsClient.getAll(sessionId, (error, response) => {
                                    // Now list should not return the view.
                                    const views = ClientBase.readBodyWithCheck(error, response);
                                    assert.ok(!_.some(views, f => f.description === view.description));

                                    done();
                                });
                            })
                        })
                    });
                });
            });
        });
    });

    describe('positive tests after all tests', () => {
        it('should get all views after all tests', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                assert.ok(Array.isArray(views));
                _.each(views, view => checkView(view));
                done();
            });
        });

    });
});
