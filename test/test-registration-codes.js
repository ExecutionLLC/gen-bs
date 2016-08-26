'use strict';

const Promise = require('bluebird');
const Uuid = require('node-uuid');
const assert = require('assert');

describe('Registration Codes', () => {
    const {registrationCodes, users} = global.webServer.server.services;

    function generateEmail() {
        return `a${Uuid.v4()}@example.com`;
    }

    function generateCodeIdAsync() {
        return registrationCodes.createManyAsync(1, 'en', 'speciality', 'description', 10)
            .then((ids) => ids[0])
    }

    describe('Positive tests', () => {
        it('generates and activates new codes', (done) => {
            registrationCodes.createManyAsync(10, 'en', 'speciality', 'description', 10)
                .then((ids) => {
                    assert.ok(ids);
                    assert.equal(ids.length, 10);
                    return ids;
                })
                .then((ids) => Promise.all(ids.map((id) => registrationCodes.activateAsync(id, 'Test',
                    'Test', generateEmail()))))
                .catch((error) => assert.fail(`Failed to activate one or more codes: ${error}`))
                .then(() => done());
        });

        it('activates successfully', (done) => {
            const testEmail = generateEmail();
            generateCodeIdAsync()
                .then((id) => registrationCodes.activateAsync(id, 'Test', 'Test', testEmail))
                .then(() => Promise.fromCallback((callback) => users.findIdByEmail(testEmail, callback)))
                .catch((error) => assert.fail(`User who activated code is not found in the database: ${error}`))
                .then(() => done());
        });
    });

    describe('Negative tests', () => {
        it('activates only once', (done) => {
            const testEmail = generateEmail();
            const otherEmail = generateEmail();
            generateCodeIdAsync()
                .then((id) => {
                    return registrationCodes.activateAsync(id, 'Test', 'Test', testEmail)
                        .catch(() => assert.fail('Code failed to activate'))
                        .then(() => registrationCodes.activateAsync(id, 'Test', 'Test', otherEmail))
                        .then(() => assert.fail('Activated the same code twice for different emails'))
                        .catch(() => Promise.resolve())
                        .then(() => registrationCodes.activateAsync(id, 'Test', 'Test', testEmail))
                        .then(() => assert.fail('Activated the same code twice for the same email'))
                        .catch(() => done());
                });
        });

        it('should work fine with unknown code', (done) => {
            registrationCodes.activateAsync(Uuid.v4(), 'Test', 'Test', generateEmail())
                .then(() => assert.fail('Activation successful for unknown code.'))
                .catch(() => done());
        });
    });
});