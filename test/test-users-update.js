'use strict';

const assert = require('assert');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const UsersClient = require('./utils/UsersClient');
const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const MockUsers = require('./mocks/mock-users.json');

const urls = new Urls('localhost', Config.port);
const usersClient = new UsersClient(urls);
const sessionsClient = new SessionsClient(urls);
const languId = Config.defaultLanguId; // used to create request headers
const wrongLanguageId = 'fr';

describe('Users.update', () => {

    function _checkFailed(done, message) {
        return (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 500);
            if (message) {
                assert.equal(result.body.message, message);
            }
            done();
        };
    }

    function _checkOk(done, userToUpdate) {
        return (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            const userUpdated = result.body;
            assert.ok(userUpdated);
            assert.deepStrictEqual(userUpdated, userToUpdate);
            done();
        };
    }

    function _mockedUserToUserObject(mockedUser) {
        return {
            id: mockedUser.id,
            firstName: mockedUser.name,
            lastName: mockedUser.last_name,
            defaultLanguageId: 'en',
            isDeleted: false,
            email: mockedUser.email,
            gender: null,
            phone: null,
            loginType: null,
            password: null,
            numberPaidSamples: mockedUser.number_paid_samples,
            languageId: mockedUser.languageId,
            speciality: mockedUser.speciality,
            company: null
        };
    }

    function _changeName(user) {
        const r = Math.random();
        return Object.assign({}, user, {
            firstName: `${user.firstName} ${r}`,
            lastName: `${user.lastName} ${r}`,
        });
    }

    function _changeLanguage(user, languageId) {
        if (languageId) {
            return Object.assign({}, user, {
                defaultLanguageId: languageId
            });
        } else { // just switch 'en' and 'ru'
            return Object.assign({}, user, {
                defaultLanguageId: user.defaultLanguageId === 'en' ? 'ru' : 'en'
            });
        }
    }

    function _withKey(user) {
        return {
            key: Config.regserver.ADD_USER_KEY,
            user
        };
    }

    const DemoUser = _mockedUserToUserObject(MockUsers[0]);
    const TestUser1 = _mockedUserToUserObject(MockUsers[1]);
    const TestUser2 = _mockedUserToUserObject(MockUsers[2]);

    describe('regular account', () => {
        let sessionId = null;

        before((done) => {
            webServer.restoreModelsMocks();
            sessionsClient.openSession(TestUser1.email, (error, response) => {
                ClientBase.readBodyWithCheck(error, response);
                sessionId = SessionsClient.getSessionFromResponse(response);
                done();
            });
        });

        after((done) => {
            usersClient.update(sessionId, languId, _withKey(TestUser1), () => { // revert changes
                webServer.setModelsMocks();
                sessionsClient.closeSession(sessionId, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);
                    done();
                });
            });
        });

        it('must update with all valid parameters (save unchanged user)', (done) => {
            const userToUpdate = TestUser1;
            usersClient.update(sessionId, languId, userToUpdate, _checkOk(done, userToUpdate));
        });
        it('must fail to change other fields except language', (done) => {
            const userToUpdate = _changeName(TestUser1);
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'Cannot update other fields! Only defaultLanguageId is allowed.'));
        });
        it('must fail to change language and other fields', (done) => {
            const userToUpdate = _changeName(_changeLanguage(TestUser1));
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'Cannot update other fields! Only defaultLanguageId is allowed.'));
        });
        it('must update language', (done) => {
            const userToUpdate = _changeLanguage(TestUser1);
            usersClient.update(sessionId, languId, userToUpdate, _checkOk(done, userToUpdate));
        });
        it('must fail to update to missing language', (done) => {
            const userToUpdate = _changeLanguage(TestUser1, wrongLanguageId);
            usersClient.update(sessionId, languId, userToUpdate, _checkFailed(done));
        });
        it('must handle empty request', (done) =>
            usersClient.update(sessionId, languId, {},
                _checkFailed(done, 'Request body is empty')));
        it('must handle no request', (done) =>
            usersClient.update(sessionId, languId, null,
                _checkFailed(done, 'Request body is empty')));
        it('must handle no session id', (done) => {
            const userToUpdate = _changeLanguage(TestUser1);
            usersClient.update(null, languId, userToUpdate,
                _checkFailed(done, 'User is undefined.'))
        });
        it('must handle no language id', (done) => {
            const userToUpdate = _changeLanguage(TestUser1);
            usersClient.update(sessionId, null, userToUpdate,
                _checkFailed(done, 'Language is not found.'))
        });

        it('user cannot change another user without secret key', (done) => {
            const userToUpdate = _changeLanguage(TestUser2);
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'Insufficient rights to perform action'));
        });

        // with secret key
        it('must update with all valid parameters (save unchanged user, with secret key)', (done) => {
            const userToUpdate = TestUser1;
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must update other fields except language (with secret key)', (done) => {
            const userToUpdate = _changeName(TestUser1);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must update language (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(TestUser1);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must fail to update to missing language (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(TestUser1, wrongLanguageId);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkFailed(done));
        });
        it('must update language and other fields (with secret key)', (done) => {
            const userToUpdate = _changeName(_changeLanguage(TestUser1));
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must change another user (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(TestUser2);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
    });

    describe('demo account', () => {
        let sessionId = null;

        before((done) => {
            webServer.restoreModelsMocks();
            sessionsClient.openSession(null, (error, response) => { // pass null for demo session to be opened, not DemoUser.email
                ClientBase.readBodyWithCheck(error, response);
                sessionId = SessionsClient.getSessionFromResponse(response);
                done();
            });
        });

        after((done) => {
            usersClient.update(sessionId, languId, _withKey(DemoUser), () => { // revert changes
                webServer.setModelsMocks();
                sessionsClient.closeSession(sessionId, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);
                    done();
                });
            });
        });

        it('must fail with all valid parameters (save unchanged user)', (done) => {
            const userToUpdate = DemoUser;
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'You cannot change the DEMO user data'));
        });
        it('must fail to change other fields except language', (done) => {
            const userToUpdate = _changeName(DemoUser);
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'You cannot change the DEMO user data'));
        });
        it('must fail to change language and other fields', (done) => {
            const userToUpdate = _changeName(_changeLanguage(DemoUser));
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'You cannot change the DEMO user data'));
        });
        it('must fail to change language', (done) => {
            const userToUpdate = _changeLanguage(DemoUser);
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'You cannot change the DEMO user data'));
        });
        it('must fail to change to missing language', (done) => {
            const userToUpdate = _changeLanguage(DemoUser, wrongLanguageId);
            usersClient.update(sessionId, languId, userToUpdate, _checkFailed(done));
        });
        it('must handle empty request', (done) =>
            usersClient.update(sessionId, languId, {},
                _checkFailed(done, 'Request body is empty')));
        it('must handle no request', (done) =>
            usersClient.update(sessionId, languId, null,
                _checkFailed(done, 'Request body is empty')));
        it('must handle no session id', (done) => {
            const userToUpdate = _changeLanguage(DemoUser);
            usersClient.update(null, languId, userToUpdate,
                _checkFailed(done, 'User is undefined.'))
        });
        it('must handle no language id', (done) => {
            const userToUpdate = _changeLanguage(DemoUser);
            usersClient.update(sessionId, null, userToUpdate,
                _checkFailed(done, 'Language is not found.'))
        });
        it('user cannot change another user without secret key', (done) => {
            const userToUpdate = _changeLanguage(TestUser2);
            usersClient.update(sessionId, languId, userToUpdate,
                _checkFailed(done, 'You cannot change the DEMO user data'));
        });

        // with secret key
        it('must update with all valid parameters (save unchanged user, with secret key)', (done) => {
            const userToUpdate = DemoUser;
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must update other fields except language (with secret key)', (done) => {
            const userToUpdate = _changeName(DemoUser);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must update language (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(DemoUser);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must fail to change to missing language (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(DemoUser, wrongLanguageId);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkFailed(done));
        });
        it('must update language and other fields (with secret key)', (done) => {
            const userToUpdate = _changeName(_changeLanguage(DemoUser));
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
        it('must change another user (with secret key)', (done) => {
            const userToUpdate = _changeLanguage(TestUser2);
            usersClient.update(sessionId, languId, _withKey(userToUpdate), _checkOk(done, userToUpdate));
        });
    });
});
