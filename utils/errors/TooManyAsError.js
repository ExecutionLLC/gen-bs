'use strict';

class TooManyAsError extends Error {
    constructor() {
        super('Too many available AS.');
    }
}

module.exports = TooManyAsError;
