/**
 * Created by vasily on 22.01.16.
 */
'use strict';

const assert = require('assert');
const HttpStatus = require('http-status');

const SessionsClient = require('./utils/SessionsClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);

const TestUser = {
    userName: 'valarie',
    password: 'password'
};

const getSessionFromResponse = (response) => {
    assert.equal(response.status, HttpStatus.OK);
    const sessionId = response.body.sessionId;
    assert.ok(sessionId, 'Session is undefined.');
    return sessionId;
};

describe('Sessions', () => {
    describe('#open', () => {
        it('should open correctly for existing user.', (done) => {
            sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
                assert.ifError(error);
                getSessionFromResponse(response);
                done();
            });
        });
        it('should fail to open session for wrong user.', (done) => {
            sessionsClient.openSession('wrongUser', 'wrongPassword', (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                done();
            });
        });
    });

    describe('#check', () => {
        it('should return the same session for the correct session.', (done) => {
            sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
                assert.ifError(error);
                const sessionId = getSessionFromResponse(response);
                sessionsClient.checkSession(sessionId, (error, response) => {
                    assert.ifError(error);
                    const anotherSessionId = getSessionFromResponse(response);
                    assert.equal(sessionId, anotherSessionId, 'Check method has returned a different session.');
                    done();
                });
            });
        });
    });

    describe('#close', () => {
        it('should properly close opened session.', (done) => {
            sessionsClient.openSession(TestUser.userName, TestUser.password, (error, response) => {
                assert.ifError(error);
                const sessionId = getSessionFromResponse(response);
                sessionsClient.closeSession(sessionId, (error, response) => {
                    assert.ifError(error);
                    assert.equal(response.status, HttpStatus.OK);
                    // Check that session is now invalid.
                    sessionsClient.checkSession(sessionId, (error, response) => {
                        assert.ifError(error);
                        assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                        done();
                    });
                });
            });
        });
    });
});
