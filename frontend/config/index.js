//const HOST = window.location.hostname;
/* global
 API_HOST: false,
 API_PORT: false,
 HEADER_SESSION: false,
 HEADER_LANGUAGE: false,
 SESSION_KEEP_ALIVE_TIMEOUT: false,
 SESSION_LOGOUT_TIMEOUT: false,
 SESSION_LOGOUT_WARNING_TIMEOUT: false,
 LOGIN_CALLBACK_PORT: false
 */
const HTTP_SCHEME = USE_SECURE_CONNECTION ? 'https' : 'http';
const WS_SCHEME = USE_SECURE_CONNECTION ? 'wss' : 'ws';
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
    LOGIN_URL: `${HTTP_SCHEME}://${HOST}:${PORT}/api/session/auth/google?callbackPort=${LOGIN_CALLBACK_PORT}`,
    FILTERS: {
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512
    },
    VIEWS: {
        MAX_NAME_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 512
    }
};

console.log(JSON.stringify(config, null, 2));

export default config;
