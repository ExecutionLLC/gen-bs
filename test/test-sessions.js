/**
 * Created by vasily on 22.01.16.
 */
'use strict';

const assert = require('assert');
const HttpStatus = require('http-status');

const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};

describe('Sessions', () => {
    describe('#open', () => {
        it('should open correctly for existing user.', (done) => {
            sessionsClient.openSession(TestUser.userEmail, (error, response) => {
                assert.ifError(error);
                const sessionId = SessionsClient.getSessionFromResponse(response);
                sessionsClient.closeSession(sessionId, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);
                    done();
                });
            });
        });
        it('should fail to open session for wrong user.', (done) => {
            sessionsClient.openSession('wrongUser@email.com', (error, response) => {
                assert.ifError(error);
                assert.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
                done();
            });
        });
    });

    describe('#check', () => {
        it('should return the same session for the correct session.', (done) => {
            sessionsClient.openSession(TestUser.userEmail, (error, response) => {
                assert.ifError(error);
                const sessionId = SessionsClient.getSessionFromResponse(response);
                sessionsClient.checkSession(sessionId, (error, response) => {
                    assert.ifError(error);
                    const anotherSessionId = SessionsClient.getSessionFromResponse(response);
                    assert.equal(sessionId, anotherSessionId, 'Check method has returned a different session.');
                    sessionsClient.closeSession(sessionId, (error, response) => {
                        ClientBase.readBodyWithCheck(error, response);
                        done();
                    });
                });
            });
        });
    });

    describe('#close', () => {
        it('should properly close opened session.', (done) => {
            sessionsClient.openSession(TestUser.userEmail, (error, response) => {
                assert.ifError(error);
                const sessionId = SessionsClient.getSessionFromResponse(response);
                sessionsClient.closeSession(sessionId, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);
                    // Check that session is now invalid.
                    sessionsClient.checkSession(sessionId, (error, response) => {
                        ClientBase.expectErrorResponse(error, response);
                        done();
                    });
                });
            });
        });
    });
});
