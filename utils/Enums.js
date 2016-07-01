'use strict';

const _ = require('lodash');

const ENTITY_TYPES = {
    STANDARD: 'standard',
    ADVANCED: 'advanced',
    USER: 'user'
};

/**
 * Types which default elements can have.
 * */
ENTITY_TYPES.defaultTypes = [ENTITY_TYPES.STANDARD, ENTITY_TYPES.ADVANCED];

/**
 * All types that are valid.
 * */
ENTITY_TYPES.allValidTypes = _.map(ENTITY_TYPES);

module.exports = {
    ENTITY_TYPES
};
