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

function generateRegcode() {
    return '' + (10000000 + Math.floor(Math.random() * 89999999));
}

function generateNextRegcode(regcode) {
    return '' + (+regcode + 1);
}

describe('Registration Codes', () => {
    const {registrationCodes, usersClient, userRequests} = global.regServer;

    function generateEmail() {
        return `a${Uuid.v4()}@example.com`;
    }

    function generateCodeAsync() {
        return registrationCodes.createManyRegcodeAsync(1, null, 'en', 'speciality', 'description', 10)
            .then((ids) => ids[0])
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
                    Promise.all(regcodeUsers.map((regcodeUser) => registrationCodes.activateAsync(regcodeUser)))
                )
                .catch((error) => assert.fail(`Failed to activate one or more codes: ${error}`))
        );

        it('activates successfully', () => {
            return generateCodeAsync()
                .then((user) => registrationCodes.activateAsync(user))
                .catch((error) => {
                    assert.fail(`Activation failed: ${error}`);
                });
        });

        function createRegcodeData(regcode) {
            const r = Math.random();
            return {
                regcode,
                speciality: 'createUserToRegcode-speciality-' + r,
                language: ('' + r).slice(-2),
                description: 'createUserToRegcode-description-' + r,
                numberOfPaidSamples: Math.floor(r * 10) + 1
            };
        }

        it('must add user with desired regcode and next user with next regcode', () => {
            const regcode = generateRegcode();
            const nextRegcode = generateNextRegcode(regcode);
            const newRegcodeData1 = createRegcodeData(regcode);
            const newRegcodeData2 = createRegcodeData(nextRegcode);
            return registrationCodes.createRegcodeAsync(newRegcodeData1.regcode, newRegcodeData1.language, newRegcodeData1.speciality, newRegcodeData1.description, newRegcodeData1.numberOfPaidSamples)
                .then((createdRegcodeData1) => {
                    assert.deepStrictEqual(createdRegcodeData1, Object.assign({}, newRegcodeData1, {id: createdRegcodeData1.id, isActivated: false}));
                })
                .then(() =>
                    registrationCodes.createRegcodeAsync(regcode, newRegcodeData2.language, newRegcodeData2.speciality, newRegcodeData2.description, newRegcodeData2.numberOfPaidSamples)
                )
                .then((createdRegcodeData2) => {
                    assert.deepStrictEqual(createdRegcodeData2, Object.assign({}, newRegcodeData2, {id: createdRegcodeData2.id, isActivated: false}));
                });
        });

        it('should add regcode and find it', () => {
            const newRegcodeData = createRegcodeData(generateRegcode());
            return registrationCodes.createRegcodeAsync(newRegcodeData.regcode, newRegcodeData.language, newRegcodeData.speciality, newRegcodeData.description, newRegcodeData.numberOfPaidSamples)
                .then((createdRegcode) => {
                    assert.ok(createdRegcode, 'Not created regcode');
                    return {regcodeId: createdRegcode.id, regcode: createdRegcode.regcode};
                })
                .then(({regcodeId, regcode}) =>
                    registrationCodes.findRegcodeAsync(regcode)
                        .then((foundRegcode) => {
                            assert.deepStrictEqual(
                                Object.assign({}, newRegcodeData, {id: regcodeId, isActivated: false}),
                                {
                                    id: foundRegcode.id,
                                    regcode: foundRegcode.regcode,
                                    isActivated: foundRegcode.isActivated,
                                    description: foundRegcode.description,
                                    language: foundRegcode.language,
                                    numberOfPaidSamples: foundRegcode.numberOfPaidSamples,
                                    speciality: foundRegcode.speciality
                                }
                            );
                            return foundRegcode;
                        })
                        .then((foundRegcode) => ({regcodeId, regcode, foundByRegcode: foundRegcode}))
                )
                .then(({regcodeId, regcode, foundByRegcode}) =>
                    registrationCodes.findRegcodeIdAsync(regcodeId)
                        .then((foundRegcode) => {
                            assert.deepStrictEqual(foundRegcode, foundByRegcode);
                        })
                )
        });

        it('should update found user', () => {
            const userRegcode = generateRegcode();
            const userEmail = generateEmail();
            const userLastName = userEmail + '-last-name';
            return registrationCodes.createRegcodeAsync(userRegcode, 'en', 'speciality', 'description', 4)
                .then((regcodeInfo) =>
                    registrationCodes.update(regcodeInfo.id, {email: userEmail, lastName: userLastName})
                )
                .then((userId) =>
                    registrationCodes.findRegcodeAsync(userRegcode)
                )
                .then((regcodeInfo) => {
                    assert(regcodeInfo.lastName === userLastName);
                    assert(regcodeInfo.email === userEmail);
                })
        });

        it('should found all requests', () => {
            return userRequests.getAllRequestsAsync()
                .then(res => {
                    assert.ok(res);
                })
        });

        it('should found all regcodes', () => {
            return registrationCodes.getAllRegcodesAsync()
                .then(res => {
                    assert.ok(res);
                })
        });
    });

    describe('Negative tests', () => {
        it('activates only once', () => {
            return generateCodeAsync()
                .then((user) =>
                    registrationCodes.activateAsync(user)
                        .then(() => mustThrowPromise(
                            registrationCodes.activateAsync(user),
                            'Activated the same code twice for different emails'
                        ))
                );
        });

        it('should work fine with unknown code', () =>
            mustThrowPromise(
                registrationCodes.activateAsync(Uuid.v4()),
                'Activation successful for unknown code.'
            )
        );

        it('should not find absent user', () =>
            Promise.resolve()
                .then(() => mustThrowPromise(
                    registrationCodes.findRegcodeAsync(generateRegcode()),
                    'find for absent regcode'
                ))
                .then(() => mustThrowPromise(
                    registrationCodes.findRegcodeIdAsync(Uuid.v4()),
                    'find for absent regcode id'
                ))
                .then(() => mustThrowPromise(
                    registrationCodes.findRegcodeAsync(null),
                    'find for null regcode'
                ))
                .then(() => mustThrowPromise(
                    registrationCodes.findRegcodeIdAsync(null),
                    'find for null regcode id'
                ))
        );
    });
});
