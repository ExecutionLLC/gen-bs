'use strict';

class TooManyUserSessionsError extends Error {
    constructor() {
        super('Too many user sessions.');
    }
}

module.exports = TooManyUserSessionsError;
