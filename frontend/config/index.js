//const HOST = window.location.hostname;
/* global
 API_HOST: false,
 API_PORT: false,
 HEADER_SESSION: false,
 HEADER_LANGUAGE: false,
 SESSION_KEEP_ALIVE_TIMEOUT: false,
 SESSION_LOGOUT_TIMEOUT: false,
 SESSION_LOGOUT_WARNING_TIMEOUT: false,
 USE_SECURE_CONNECTION: false
 */
const HTTP_SCHEME = JSON.parse(USE_SECURE_CONNECTION) ? 'https' : 'http';
const WS_SCHEME = JSON.parse(USE_SECURE_CONNECTION) ? 'wss' : 'ws';
const HOST = API_HOST;
const PORT = API_PORT;

const config = {
    HOST,
    PORT,
    HTTP_SCHEME,
    WS_SCHEME,
    URLS: {
        WS: `${WS_SCHEME}://${HOST}:${PORT}`,
        FILE_UPLOAD: `${HTTP_SCHEME}://${HOST}:${PORT}/api/samples/upload`
    },
    HEADERS: {
        SESSION: HEADER_SESSION,
        LANGUAGE: HEADER_LANGUAGE
    },
    SESSION: {
        KEEP_ALIVE_TIMEOUT: SESSION_KEEP_ALIVE_TIMEOUT,
        LOGOUT_TIMEOUT: SESSION_LOGOUT_TIMEOUT,
        LOGOUT_WARNING_TIMEOUT: SESSION_LOGOUT_WARNING_TIMEOUT
    },
    LOGIN_URL: `${HTTP_SCHEME}://${HOST}:${PORT}/api/session/auth/google/login`,
    FILTERS: {
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512,
        MAX_VALUE_LENGTH: 50
    },
    VIEWS: {
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512
    },
    ANALYSIS: {
        MAX_COMMENT_LENGTH: 1024,
        MAX_FILTER_LENGTH: 50,
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512
    },
    UPLOADS: {
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512
    },
    SAMPLES: {
        MAX_PROPERTY_LENGTH: 100
    },
    WEBSOCKET_RECONNECT_TIME_MS: 2000
};

console.log(JSON.stringify(config, null, 2));

export default config;
