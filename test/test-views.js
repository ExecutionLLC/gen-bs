'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const ViewsClient = require('./utils/ViewsClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const viewsClient = new ViewsClient(urls);

const languId = Config.defaultLanguId;

const TestUser = {
    userName: 'valarie',
    password: 'password'
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
        sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    describe('positive tests', () => {
        it('should get all views', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const views = response.body;
                assert.ok(views);
                assert.ok(Array.isArray(views));
                _.each(views, view => checkView(view));
                done();
            });
        });

        it('should get existing view', (done) => {
            viewsClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const views = response.body;
                assert.ok(views);
                const firstView = views[0];

                viewsClient.get(sessionId, firstView.id, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const view = response.body;
                    assert.ok(view);
                    checkView(view);
                    done();
                });
            });
        });

        it('should create and update existing user view', (done) => {
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
                    assert.notEqual(addedView.id, view.id, 'View id is not changed.');
                    assert.equal(addedView.name, view.name);
                    assert.equal(addedView.type, 'user');

                    // Update created view.
                    const viewToUpdate = _.cloneDeep(addedView);
                    viewToUpdate.name = 'Test View ' + Uuid.v4();
                    viewToUpdate.type = 'advanced';

                    viewsClient.update(sessionId, viewToUpdate, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);
                        const updatedView = response.body;
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
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const views = response.body;
                assert.ok(views);
                const nonUserView = _.find(views, view => view.type !== 'user');
                assert.ok(nonUserView, 'Cannot find any non-user view');
                nonUserView.name = 'Test Name' + Uuid.v4();

                viewsClient.update(sessionId, nonUserView, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                    done();
                });
            });
        });

        it('should fail to get list in incorrect session', (done) => {
            viewsClient.getAll(UnknownSessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assert.ok(response.body);
                done();
            })
        });

        it('should fail to get unknown view', (done) => {
            viewsClient.get(sessionId, UnknownViewId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assert.ok(response.body);
                done();
            });
        });
    });
});
