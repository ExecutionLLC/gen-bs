'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
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
        _.any(['standard', 'advanced', 'user'], (type) => view.type === type)
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
                    assert.equal(addedView.type, 'user');

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = 'advanced';

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        const updatedView = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(updatedView);
                        assert.notEqual(updatedView.id, viewToUpdate.id);
                        assert.equal(updatedView.name, viewToUpdate.name);
                        assert.equal(updatedView.type, 'user', 'View type change should not be allowed by update.');
                        done();
                    });
                });
            });
        });
    });

    describe('failure tests', () => {
        it('should fail to update non-user view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                const views = ClientBase.readBodyWithCheck(error, response);
                assert.ok(views);
                const nonUserView = _.find(views, view => view.type !== 'user');
                assert.ok(nonUserView, 'Cannot find any non-user view');
                nonUserView.name = 'Test Name' + Uuid.v4();

                viewsClient.update(sessionId, nonUserView, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);
                    done();
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
                    assert.equal(addedView.type, 'user');

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = 'advanced';
                    const viewItem = viewToUpdate.viewListItems[0];
                    viewItem.fieldId = null;
                    viewToUpdate.viewListItems.push(viewItem)

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
                    assert.equal(addedView.type, 'user');

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = 'advanced';
                    viewToUpdate.viewListItems = [];

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);
                        done();
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
