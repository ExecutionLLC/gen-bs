'use strict';

class InvalidSessionError extends Error {
    constructor(message) {
        super(message || 'Invalid session');
    }
}

module.exports = InvalidSessionError;
