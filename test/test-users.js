'use strict';

const assert = require('assert');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');

const UsersClient = require('./utils/UsersClient');

const urls = new Urls('localhost', Config.port);
const usersClient = new UsersClient(urls);

describe('Users', () => {

    before((done) => {
        webServer.restoreModelsMocks();
        done();
    });

    after((done) => {
        webServer.setModelsMocks();
        done();
    });

    function makeUser(isPassword, password) {
        const r = Math.random();
        return {
            firstName: 'TestUserFirstName' + r,
            lastName: 'TestUserLastName' + r,
            gender: 'TestUserGender' + r,
            loginType: isPassword ? 'password' : 'google',
            password: password,
            email: ('TestUserEmail' + r + '@example.com').toLowerCase(),
            phone: 'TestUserPhone' + r,
            company: 'TestUserCompany' + r,
            speciality: 'TestUserSpeciality' + r,
            languageId: 'en',
            numberPaidSamples: Math.floor(r * 10 + 1)
        }
    }

    it('must add user', (done) => {
        const user = makeUser();
        usersClient.add({key: Config.regserver.ADD_USER_KEY, user}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            const addedUser = result.body;
            assert.ok(addedUser);
            assert.ok(addedUser.id);
            assert.equal(typeof addedUser.id, 'string');
            assert.deepStrictEqual(addedUser, Object.assign({}, user, {
                id: addedUser.id,
                password: null,
                defaultLanguageId: 'en', // language got from header...
                languageId: 'en', // ... it is not expected behavior but it is for now
                isDeleted: false
            }));
            done();
        });
    });

    it('must handle empty request', (done) => {
        usersClient.add({}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 500);
            done();
        });
    });
    it('must handle no request', (done) => {
        usersClient.add(null, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 500);
            done();
        });
    });
    it('must not add with no key', (done) => {
        usersClient.add({user: makeUser()}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 500);
            done();
        });
    });
    it('must not add with wrong key', (done) => {
        usersClient.add({key: Config.regserver.ADD_USER_KEY + '-wrong', user: makeUser()}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 500);
            done();
        });
    });
    it('must fail at add user with existing email', (done) => {
        const user1 = makeUser();
        const user2 = Object.assign({}, makeUser(), {email: user1.email});
        usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user1}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user2}, (err, result) => {
                assert.equal(err, null);
                assert.equal(result.status, 500);
                done();
            });
        });
    });

    function checkUpdateResult(userToUpdate, userUpdated) {
        assert.deepStrictEqual(userUpdated, Object.assign({}, userToUpdate, {
            password: null,
            defaultLanguageId: 'en', // language got from header...
            languageId: 'en', // ... it is not expected behavior but it is for now
            isDeleted: false
        }));
    }

    it('must update user', (done) => {
        const user1 = makeUser();
        usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user1}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            const addedUser = result.body;
            const user2 = Object.assign({}, makeUser(), {id: addedUser.id});
            usersClient.update({key: Config.regserver.ADD_USER_KEY, user: user2}, (err, result) => {
                assert.equal(err, null);
                assert.equal(result.status, 200);
                const updatedUser = result.body;
                assert.ok(updatedUser);
                checkUpdateResult(user2, updatedUser);
                done();
            });
        });
    });
    it('must update user with one with same email', (done) => {
        const user1 = makeUser();
        usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user1}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            const addedUser = result.body;
            const user2 = Object.assign({}, makeUser(), {id: addedUser.id, email: addedUser.email});
            usersClient.update({key: Config.regserver.ADD_USER_KEY, user: user2}, (err, result) => {
                assert.equal(err, null);
                assert.equal(result.status, 200);
                const updatedUser = result.body;
                assert.ok(updatedUser);
                checkUpdateResult(user2, updatedUser);
                done();
            });
        });
    });
    it('must not update user with existing email', (done) => {
        const user1 = makeUser();
        const user2 = makeUser();
        usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user1}, (err, result) => {
            assert.equal(err, null);
            assert.equal(result.status, 200);
            usersClient.add({key: Config.regserver.ADD_USER_KEY, user: user2}, (err, result) => {
                assert.equal(err, null);
                assert.equal(result.status, 200);
                const addeduser2 = result.body;
                const user2WithEmailOf1 = Object.assign({}, makeUser(), {id: addeduser2.id, email: user1.email});
                usersClient.update({key: Config.regserver.ADD_USER_KEY, user: user2WithEmailOf1}, (err, result) => {
                    assert.equal(err, null);
                    assert.equal(result.status, 500);
                    done();
                });
            });
        });
    });
});