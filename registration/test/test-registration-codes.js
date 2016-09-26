'use strict';

const Uuid = require('node-uuid');
const assert = require('assert');


function mustThrowPromise(promise, message) {
    return new Promise((resolve, reject) =>
        promise
            .then((result) => reject(`'${message}' must fail but has result '${result}'`))
            .catch(() => resolve())
    );
}


describe('Registration Codes', () => {
    const {registrationCodes, usersClient} = global.regServer;

    function generateEmail() {
        return `a${Uuid.v4()}@example.com`;
    }

    function generateCodeIdAsync() {
        return registrationCodes.createManyRegcodeAsync(1, null, 'en', 'speciality', 'description', 10)
            .then((ids) => ids[0].id)
    }

    describe('Positive tests', () => {
        it('generates and activates new codes', () =>
            registrationCodes.createManyRegcodeAsync(10, null, 'en', 'speciality', 'description', 10)
                .then((regcodeUsers) => {
                    assert.ok(regcodeUsers);
                    assert.equal(regcodeUsers.length, 10);
                    return regcodeUsers;
                })
                .then((regcodeUsers) =>
                    Promise.all(regcodeUsers.map((regcodeUser) => registrationCodes.activateAsync(regcodeUser.id, 'Test', 'Test', generateEmail())))
                )
                .catch((error) => assert.fail(`Failed to activate one or more codes: ${error}`))
        );

        it('activates successfully', () => {
            const testEmail = generateEmail();
            return generateCodeIdAsync()
                .then((id) => registrationCodes.activateAsync(id, 'Test', 'Test', testEmail))
                .then(() => usersClient.findIdByEmailAsync(testEmail))
                .catch((error) => {
                    assert.fail(`User who activated code is not found in the database: ${error}`);
                });
        });

        it('must add user with regcode', () => {
            const regcode = '' + (10000000 + Math.floor(Math.random() * 89999999));
            const nextRegcode = '' + (+regcode + 1);
            return registrationCodes.createAsync(regcode, 'en', 'speciality', 'description', 4)
                .then((createdUser) => {
                    assert.equal(createdUser.regcode, regcode);
                })
                .then(() =>
                    registrationCodes.createAsync(regcode, 'en', 'speciality', 'description', 4)
                )
                .then((createdUser) => {
                    assert.equal(createdUser.regcode, nextRegcode);
                });
        })
    });

    describe('Negative tests', () => {
        it('activates only once', () => {
            const testEmail = generateEmail();
            const otherEmail = generateEmail();
            return generateCodeIdAsync()
                .then((id) =>
                    registrationCodes.activateAsync(id, 'Test', 'Test', testEmail)
                        .then(() => mustThrowPromise(
                            registrationCodes.activateAsync(id, 'Test', 'Test', otherEmail),
                            'Activated the same code twice for different emails'
                        ))
                        .then(() => mustThrowPromise(
                            registrationCodes.activateAsync(id, 'Test', 'Test', testEmail),
                            'Activated the same code twice for the same email'
                        ))
                );
        });

        it('should work fine with unknown code', () =>
            mustThrowPromise(
                registrationCodes.activateAsync(Uuid.v4(), 'Test', 'Test', generateEmail()),
                'Activation successful for unknown code.'
            )
        );
    });
});
