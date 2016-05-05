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
const HOST = API_HOST;
const PORT = API_PORT;

console.log(`Using API ${HOST}:${PORT}`);

const config = {
    HOST: HOST,
    PORT: PORT,
    URLS: {
        WS: `ws://${HOST}:${PORT}`,
        FILE_UPLOAD: `http://${HOST}:${PORT}/api/samples/upload`
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
    LOGIN_URL: `http://${HOST}:${PORT}/api/session/auth/google?callbackPort=${LOGIN_CALLBACK_PORT}`
};

export default config
