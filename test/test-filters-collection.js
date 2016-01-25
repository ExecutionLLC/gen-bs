'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const FiltersClient = require('./utils/FiltersClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const filtersClient = new FiltersClient(urls);

const TestUser = {
    userName: 'valarie',
    password: 'password'
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
        sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    describe('positive tests', () => {
        it('should get all filters', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                const filters = response.body;
                assert.ok(filters);
                assert.ok(Array.isArray(filters));
                _.each(filters, filter => checkFilter(filter));
                done();
            });
        });
        it('should get existing filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                const filters = response.body;
                assert.ok(filters);
                const firstFilter = filters[0];

                filtersClient.get(sessionId, firstFilter.id, (error, response) => {
                    assert.ifError(error);
                    const filter = response.body;
                    assert.ok(filter);
                    checkFilter(filter);
                    done();
                });
            });
        });
        it('should create and update existing user filter', (done) => {
            // TODO: create new user filter and update it.
            done();
        });

    });

    describe('failure tests', () => {

        it('should fail to update non-user filter', (done) => {
            filtersClient.getAll(sessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.OK);
                const filters = response.body;
                assert.ok(filters);
                const nonUserFilter = _.find(filters, filter => filter.type !== 'user');
                assert.ok(nonUserFilter, 'Cannot find any non-user filter');
                nonUserFilter.name = 'Test Name' + Uuid.v4();
                filtersClient.update(sessionId, nonUserFilter, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                    done();
                });
            });
        });
        it('should fail to get list in incorrect session', (done) => {
            filtersClient.getAll(UnknownSessionId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assert.ok(response.body);
                done();
            })
        });

        it('should fail to get unknown filter', (done) => {
            filtersClient.get(sessionId, UnknownFilterId, (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assert.ok(response.body);
                done();
            });
        });
    });
});
