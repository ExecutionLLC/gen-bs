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
        return registrationCodes.createManyAsync(1, 'en', 'speciality', 'description', 10)
            .then((ids) => ids[0])
    }

    describe('Positive tests', () => {
        it('generates and activates new codes', () =>
            registrationCodes.createManyAsync(10, 'en', 'speciality', 'description', 10)
                .then((ids) => {
                    assert.ok(ids);
                    assert.equal(ids.length, 10);
                    return ids;
                })
                .then((ids) =>
                    Promise.all(ids.map((id) => registrationCodes.activateAsync(id, 'Test', 'Test', generateEmail())))
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
