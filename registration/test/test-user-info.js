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
        it('shoult not add user without email or regcode', () =>
            Promise.resolve()
                .then(() => mustThrowPromise(
                    userInfo.create({}),
                    'add user with no email and regcode'
                ))
        );
    });

});