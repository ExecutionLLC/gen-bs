'use strict';

const _ = require('lodash');

function createEnum(keyValueObject) {
    return Object.assign({}, keyValueObject, {
        allValues: _.map(keyValueObject)
    });
}

const OBJECT_STORAGE_TYPES = createEnum({
    S3: 's3',
    OSS: 'oss',
    FILE: 'file'
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

const MODEL_TYPES = createEnum({
    FILTER: 'filter',
    COMPLEX: 'complex'
});

const ANALYSIS_TYPES = createEnum({
    ALL: 'all',
    TUMOR: 'tumor',
    FAMILY: 'family'
});

const SAMPLE_UPLOAD_STATUS = createEnum({
    IN_PROGRESS: 'in_progress',     // Currently active
    READY: 'ready',                 // Successfully uploaded
    ERROR: 'error'                  // Failed with error
});

const LOGIN_TYPES = createEnum({
    GOOGLE: 'google',
    PASSWORD: 'password'
});

const EVENT_TYPES = createEnum({
    LOGIN: 'login'
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

const WS_SAMPLE_UPLOAD_STATE = createEnum({
    UNCONFIRMED: 'unconfirmed', // the sample was created after header parsing on WS
    NOT_FOUND: 'not_found', // the sample was not found during parsing on AS
    COMPLETED: 'completed', // the sample was successfully parsed on AS
    ERROR: 'error' // an error has occurred while parsing the file with this sample.
});

const SAMPLE_TYPE = createEnum({
    VCF: 'vcf',
    TXT: 'txt'
});

module.exports = {
    OBJECT_STORAGE_TYPES,
    SEARCH_SERVICE_EVENTS,
    ENTITY_TYPES,
    WS_INSTANCE_MESSAGE_TYPES,
    MODEL_TYPES,
    ANALYSIS_TYPES,
	SAMPLE_UPLOAD_STATUS,
    LOGIN_TYPES,
    EVENT_TYPES,
    WS_SAMPLE_UPLOAD_STATE,
    SAMPLE_TYPE
};
