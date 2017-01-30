'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const {ENTITY_TYPES} = require('../utils/Enums');
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

const checkFilter = (filter) => {
    assert.ok(filter.id);
    assert.ok(filter.name);
    assert.ok(
        _.includes(ENTITY_TYPES.allValues, filter.type)
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

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
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
                    assert.equal(addedFilter.type, ENTITY_TYPES.USER);

                    // Update created filter.
                    const filterToUpdate = _.cloneDeep(addedFilter);
                    filterToUpdate.name = 'Test Filter ' + Uuid.v4();
                    filterToUpdate.type = ENTITY_TYPES.ADVANCED;

                    filtersClient.update(sessionId, filterToUpdate, (error, response) => {
                        const updatedFilter = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(updatedFilter);
                        assert.notEqual(updatedFilter.id, filterToUpdate.id);
                        assert.equal(updatedFilter.type, ENTITY_TYPES.USER, 'Filter type change should not be allowed by update.');
                        done();
                    });
                });
            });
        });
    });

    describe('failure tests', () => {
        it('should fail to update or delete non-user filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const nonUserFilter = _.find(filters, filter => filter.type !== ENTITY_TYPES.USER);
                assert.ok(nonUserFilter, 'Cannot find any non-user filter');
                nonUserFilter.name = 'Test Name' + Uuid.v4();

                filtersClient.update(sessionId, nonUserFilter, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    filtersClient.remove(sessionId, nonUserFilter.id, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);

                        done();
                    });
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
                filter.description = Uuid.v4();

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedFilter = response.body;
                    assert.ok(addedFilter);
                    assert.equal(addedFilter.name, filter.name);
                    assert.equal(addedFilter.description, filter.description);

                    // Delete created filter
                    filtersClient.remove(sessionId, addedFilter.id, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.OK);

                        // It should not return with all user filters.
                        filtersClient.getAll(sessionId, (error, response) => {
                            const filters = ClientBase.readBodyWithCheck(error, response);
                            assert.ok(!_.some(filters, f => f.id == addedFilter.id));

                            // It should be possible to retrieve it by id (history support).
                            filtersClient.get(sessionId, addedFilter.id, (error, response) => {
                                assert.ifError(error);
                                assert.equal(response.status, HttpStatus.OK);

                                // It should fail to update removed filter.
                                const filterToUpdate = _.cloneDeep(addedFilter);
                                filterToUpdate.name = 'Test Filter ' + Uuid.v4();

                                filtersClient.update(sessionId, filterToUpdate, (error, response) => {
                                    ClientBase.expectErrorResponse(error, response);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('should fail to create filter with empty name', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const filter = filters[0];
                filter.name = '';

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                })
            })
        });

        it('should fail to add filter with existing name', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const filter = filters[0];

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to add filter with existing name with leading and trailing spaces', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                const filters = ClientBase.readBodyWithCheck(error, response);
                assert.ok(filters);
                const filter = filters[0];
                filter.name = ' ' + filter.name + ' ';

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    ClientBase.expectErrorResponse(error, response);

                    done();
                });
            });
        });

        it('should fail to get unknown filter', (done) => {
            filtersClient.get(sessionId, UnknownFilterId, (error, response) => {
                ClientBase.expectErrorResponse(error, response);
                done();
            });
        });

        it('should not return previous version of the filter when current version is deleted (issue #337)', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const filters = response.body;
                assert.ok(filters);
                const filter = filters[0];
                filter.name = 'Test Filter ' + Uuid.v4();
                // Will search the filter by description below.
                filter.description = Uuid.v4();

                filtersClient.add(sessionId, languId, filter, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    const addedFilter = response.body;
                    assert.ok(addedFilter);
                    assert.equal(addedFilter.name, filter.name);
                    assert.equal(addedFilter.description, filter.description);

                    // Now it should return.
                    filtersClient.getAll(sessionId, (error, response) => {
                        const filters = ClientBase.readBodyWithCheck(error, response);
                        assert.ok(_.some(filters, f => f.id === addedFilter.id));
                        assert.ok(_.some(filters, f => f.description === filter.description));

                        const filterToUpdate = Object.assign({}, addedFilter, {
                            name: Uuid.v4()
                        });

                        // Make new version.
                        filtersClient.update(sessionId, filterToUpdate, (error, response) => {
                            const updatedFilter = ClientBase.readBodyWithCheck(error, response);

                            // Delete the last version.
                            filtersClient.remove(sessionId, updatedFilter.id, (error, response) => {
                                ClientBase.readBodyWithCheck(error, response);

                                filtersClient.getAll(sessionId, (error, response) => {
                                    // Now filters list should not return the filter.
                                    const filters = ClientBase.readBodyWithCheck(error, response);
                                    assert.ok(!_.some(filters, f => f.description === filter.description));

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
