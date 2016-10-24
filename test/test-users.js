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
            email: 'TestUserEmail' + r + '@example.com',
            phone: 'TestUserPhone' + r,
            company: 'TestUserCompany' + r,
            speciality: 'TestUserSpeciality' + r,
            language: ('' + r).slice(-2),
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
                defaultLanguId: 'en', // language got from header...
                language: 'en', // ... it is not expected behavior but it is for now
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
});