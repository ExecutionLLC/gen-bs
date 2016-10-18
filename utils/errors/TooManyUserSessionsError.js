'use strict';

class TooManyUserSessionsError extends Error {
    constructor() {
        super('TooManyUserSessions');
    }
}

module.exports = TooManyUserSessionsError;
