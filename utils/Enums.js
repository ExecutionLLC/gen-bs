'use strict';

const _ = require('lodash');

function createEnum(keyValueObject) {
    return Object.assign({}, keyValueObject, {
        allValues: _.map(keyValueObject)
    });
}

const OBJECT_STORAGE_TYPES = createEnum({
    S3: 's3',
    OSS: 'oss'
});

const SEARCH_SERVICE_EVENTS = createEnum({
    onDataReceived: 'onDataReceived'
});

const ENTITY_TYPES = createEnum({
    STANDARD: 'standard',
    ADVANCED: 'advanced',
    USER: 'user',
    DEFAULT: 'default'
});

const SAMPLE_UPLOAD_STATUS = createEnum({
    IN_PROGRESS: 'in_progress',     // Currently active
    READY: 'ready',                 // Successfully uploaded
    ERROR: 'error'                  // Failed with error
});

/**
 * Types which default elements can have.
 * */
ENTITY_TYPES.defaultTypes = [
    ENTITY_TYPES.DEFAULT,
    ENTITY_TYPES.STANDARD,
    ENTITY_TYPES.ADVANCED
];

const WS_INSTANCE_MESSAGE_TYPES = createEnum({
    RABBIT_CONNECTION_LOST: 'rabbit_connection_lost',
    SAMPLE_UPLOAD_COMPLETED: 'sample_upload_completed'
});

module.exports = {
    OBJECT_STORAGE_TYPES,
    SEARCH_SERVICE_EVENTS,
    ENTITY_TYPES,
    WS_INSTANCE_MESSAGE_TYPES,
    SAMPLE_UPLOAD_STATUS
};
