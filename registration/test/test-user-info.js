'use strict';

const Uuid = require('node-uuid');
const assert = require('assert');


function mustThrowPromise(promise, message) {
    return new Promise((resolve, reject) =>
        promise
            .then((result) => reject(`'${message}' must fail but has result '${JSON.stringify(result)}'`))
            .catch((err) => resolve())
    );
}


describe('User info', () => {
    const {userInfo} = global.regServer;

    function generateEmail() {
        return `a${Uuid.v4()}@example.com`;
    }

    function generateRegcode() {
        return '' + (10000000 + Math.floor(Math.random() * 89999999));
    }

    describe('Positive tests', () => {
        it('should add user and find it for regcode', () => {
            const userRegcode = generateRegcode();
            const userFirstName = userRegcode + '-first-name';
            return userInfo.create({regcode: userRegcode, firstName: userFirstName})
                .then((user) => {
                    assert.ok(user, `Not created user ${({regcode: userRegcode, firstName: userFirstName})}`);
                    return user.id;
                })
                .then((userId) =>
                    userInfo.findByRegcodeOrEmailAsync(userRegcode)
                        .then((foundUser) => {
                            assert.equal(foundUser.id, userId, 'found created user id');
                            assert.equal(foundUser.firstName, userFirstName, 'found created user name');
                            assert.equal(foundUser.regcode, userRegcode, 'found created user regcode');
                        })
                )
        });
        it('should update found user', () => {
            const userRegcode = generateRegcode();
            const userEmail = generateEmail();
            const userLastName = userEmail + '-last-name';
            const userNewLastName = userEmail + '-new-last-name';
            return userInfo.create({regcode: userRegcode, email: userEmail, lastName: userLastName})
                .then((user) =>
                    userInfo.update(user.id, {lastName: userNewLastName})
                )
                .then((userId) =>
                    userInfo.findByRegcodeOrEmailAsync(userRegcode)
                )
                .then((foundUser) => {
                    assert(foundUser.lastName === userNewLastName);
                })
        });
    });

    describe('Negative tests', () => {
        it('should not find absent user', () =>
            Promise.resolve()
                .then(() => mustThrowPromise(
                    userInfo.findByRegcodeOrEmailAsync(generateRegcode()),
                    'find for absent regcode'
                ))
        );
        it('shoult not add user without email or regcode', () =>
            Promise.resolve()
                .then(() => mustThrowPromise(
                    userInfo.create({}),
                    'add user with no email and regcode'
                ))
        );
        it('should not find user with no regcode', () =>
            Promise.resolve()
                .then(() => userInfo.create({email: generateEmail()}))
                .then(() => userInfo.create({regcode: generateRegcode()}))
                .then(() => mustThrowPromise(
                    userInfo.findByRegcodeOrEmailAsync(null),
                    'find for null regcode'
                ))
        );
    });

});