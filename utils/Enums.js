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

const WS_INSTANCE_MESSAGE_TYPES = {
    SAMPLE_ADDED: 'sample_added'
};

module.exports = {
    ENTITY_TYPES,
    WS_INSTANCE_MESSAGE_TYPES
};
