'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const FiltersClient = require('./utils/FiltersClient');
const ClientBase = require('./utils/ClientBase');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const filtersClient = new FiltersClient(urls);

const languId = Config.defaultLanguId;

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};

const UnknownFilterId = Uuid.v4();
const UnknownSessionId = Uuid.v4();

const checkFilter = (filter) => {
    assert.ok(filter.id);
    assert.ok(filter.name);
    assert.ok(
        _.any(['standard', 'advanced', 'user'], (type) => filter.type === type)
    );
    assert.ok(filter.rules);
};

describe('Filters', () => {
    let sessionId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    describe('positive tests', () => {
        it('should get all filters', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                assert.ok(Array.isArray(filters));
                _.each(filters, filter => checkFilter(filter));
                done();
            });
        });

        it('should get existing filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const firstFilter = filters[0];

                filtersClient.get(sessionId, firstFilter.id, (error, response) => {
                    const filter = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(filter);
                    checkFilter(filter);
                    done();
                });
            });
        });

        it('should create and update existing user filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const filter = filters[0];
                filter.name = 'Test Filter ' + Uuid.v4();

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    const addedFilter = ClientBase.readBodyWithCheck(error, response);
                    assert.ok(addedFilter);
                    assert.notEqual(addedFilter.id, filter.id, 'Filter id is not changed.');
                    assert.equal(addedFilter.name, filter.name);
                    assert.equal(addedFilter.type, 'user');

                    // Update created filter.
                    const filterToUpdate = _.cloneDeep(addedFilter);
                    filterToUpdate.name = 'Test Filter ' + Uuid.v4();
                    filterToUpdate.type = 'advanced';

                    filtersClient.update(sessionId, filterToUpdate, (error, response) => {
                        const updatedFilter = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(updatedFilter);
                        assert.notEqual(updatedFilter.id, filterToUpdate.id);
                        assert.equal(updatedFilter.name, filterToUpdate.name);
                        assert.equal(updatedFilter.type, 'user', 'Filter type change should not be allowed by update.');
                        done();
                    });
                });
            });
        });
    });

    describe('failure tests', () => {
        it('should fail to update non-user filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const nonUserFilter = _.find(filters, filter => filter.type !== 'user');
                assert.ok(nonUserFilter, 'Cannot find any non-user filter');
                nonUserFilter.name = 'Test Name' + Uuid.v4();

                filtersClient.update(sessionId, nonUserFilter, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);
                    done();
                });
            });
        });

        it('should not fail to get and fail to update deleted user filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const filters = response.body;
                assert.ok(filters);
                const filter = filters[0];
                filter.name = 'Test Filter ' + Uuid.v4();

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedFilter = response.body;
                    assert.ok(addedFilter);

                    // Delete created filter
                    filtersClient.remove(sessionId, addedFilter.id, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);

                        filtersClient.get(sessionId, addedFilter.id, (error, response) => {
                            assert.ifError(error);
                            assert.equal(response.status, HttpStatus.OK);

                            // Trying to update created filter.
                            const filterToUpdate = _.cloneDeep(addedFilter);
                            filterToUpdate.name = 'Test Filter ' + Uuid.v4();

                            filtersClient.update(sessionId, filterToUpdate, (error, response) => {
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
            filtersClient.getAll(UnknownSessionId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            })
        });

        it('should fail to get unknown filter', (done) => {
            filtersClient.get(sessionId, UnknownFilterId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            });
        });
    });

});
