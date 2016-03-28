import HttpStatus from 'http-status';

import config from '../../config';
import { getCookie } from '../utils/cookie';

import { fetchUserdata } from './userData';
import { createWsConnection, subscribeToWs, send } from './websocket';
import { handleError } from './errorHandler'

import apiFacade from '../api/ApiFacade';
import SessionsClient from '../api/SessionsClient'

/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION';
export const REQUEST_SESSION = 'REQUEST_SESSION';

export const RECEIVE_LOGOUT = 'RECEIVE_LOGOUT';
export const REQUEST_LOGOUT = 'REQUEST_LOGOUT';

export const LOGIN_ERROR = 'LOGIN_ERROR';

const sessionsClient = apiFacade.sessionsClient;

/*
 * login errors
 */

const LOGIN_NETWORK_ERROR = 'Authorization failed (network error). You can reload page and try again.'
const LOGIN_SERVER_ERROR = 'Authorization failed (internal server error). You can reload page and try again.'
const LOGIN_GOOGLE_ERROR = 'Google authorization failed.'

/*
 * Start keep alive task, which update session on the WS.
 */

class KeepAliveTask {
    constructor(period) {
        this.period = period;
        this.keepAliveTaskId = null;
    }

    isRunning () {
        return this.keepAliveTaskId !== null;
    }

    start() {
        if (!this.isRunning()) {
            this._scheduleTask();
        }
    }

    stop() {
        if (this.isRunning()) {
            clearTimeout(this.keepAliveTaskId);
        }
    }

    _scheduleTask() {
        this.keepAliveTaskId = setTimeout(() => {
            const currentSessionId = window.reduxStore.getState().auth.sessionId;
            if (currentSessionId) {
                // update session on the web server
                checkSession(currentSessionId, null);
            }
            // reschedule task
            this._scheduleTask();
        }, this.period);
    }
}

const keepAliveTask = new KeepAliveTask(config.SESSION.KEEP_ALIVE_TIMEOUT*1000);
keepAliveTask.start()

/*
 * action creators
 */

function requestSession() {
    return {
        type: REQUEST_SESSION
    }
}

function receiveSession(sessionId, isDemo) {
    sessionId = sessionId || null;
    const isAuthenticated = (sessionId !== null);

    document.cookie = `sessionId=${sessionId}`;

    return {
        type: RECEIVE_SESSION,
        sessionId: sessionId,
        isAuthenticated: isAuthenticated,
        isDemo: isDemo,
        receivedAt: Date.now()
    }
}

function loginError(errorMessage) {
    return {
        type: LOGIN_ERROR,
        errorMessage
    }
}

function updateLoginData(dispatch, sessionId, isDemo) {
    var conn = new WebSocket(config.URLS.WS);
    dispatch(receiveSession(sessionId, isDemo));
    dispatch(createWsConnection(conn));
    dispatch(subscribeToWs(sessionId));
    // IMPORTANT: Do not touch the next line, until you remove all JQuery API
    // requests.
    $.ajaxSetup({
        headers: {
            'X-Session-Id': sessionId,
            'X-Language-Id': 'en'
        }
    });
    dispatch(fetchUserdata());
}

// Create new demo session.
function openDemoSession(dispatch) {
    console.log('loginAsDemoUser');
    sessionsClient.openSession(null, (error, response) => {
        if (error) {
            dispatch(loginError(error));
            dispatch(handleError(null, LOGIN_NETWORK_ERROR, null));
        } else if (response.status !== HttpStatus.OK) {
            dispatch(loginError(response.body));
            dispatch(handleError(null, LOGIN_SERVER_ERROR, null));
        } else {
            const sessionId = SessionsClient.getSessionFromResponse(response);
            if (sessionId) {
                updateLoginData(dispatch, sessionId, true);
            } else {
                dispatch(loginError('Session id is empty'));
                dispatch(handleError(null, LOGIN_SERVER_ERROR, null));
            }
        }
    });
}

// Checks session state by sessionId.
function checkSession(sessionId, callback) {
    console.log('checkSession');
    sessionsClient.checkSession(sessionId, (error, response) => {
        if (!callback) {
            return;
        }
        if (!error) {
            const isValidSession = response.status === HttpStatus.OK;
            const isDemoSession = isValidSession ? response.sessionType === 'DEMO' : null;
            callback(null, isValidSession, isDemoSession);
        } else {
            callback(error);
        }
    });
}

// If session stored in cookie is valid, then restore it, otherwise create new
// demo session.
function checkCookieSessionAndLogin(dispatch) {
    dispatch(requestSession());
    const sessionIdFromCookie = getCookie('sessionId');
    if (sessionIdFromCookie) {
        checkSession(sessionIdFromCookie, (error, isValidSession, isDemoSession) => {
            if (error) {
                // it is fatal network error
                dispatch(loginError(error));
                dispatch(handleError(null, LOGIN_NETWORK_ERROR, null));
            } else if (isValidSession) {
                // restore old session
                updateLoginData(dispatch, sessionIdFromCookie, isDemoSession);
            } else {
                // old session is not valid, so we create new one
                openDemoSession(dispatch);
            }
        });
    } else {
        // old session is not valid, so we create new one
        openDemoSession(dispatch);
    }
}

// see http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function _getUrlParameterByName(name, url) {
    if (!url) {
        url = location.href;
    }
    // This is just to avoid case sensitiveness
    url = url.toLowerCase();
    // This is just to avoid case sensitiveness for query parameter name
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// Algorithm:
// 1. If we stay on the URL returned by google and sessionId is valid, then
// we should login as real user (not demo).
// 2. If we got error from google, then we should try to restore old session or
// create new demo session and send notification about error.
// 3. In all other situations we should silently try to restore old session or
// create new demo session.
//
// It is legacy of previous developer :)
export function login() {
    const sessionIdFromParams = _getUrlParameterByName('sessionId');
    const errorFromParams = _getUrlParameterByName('error');

    return dispatch => {
        if (!errorFromParams && sessionIdFromParams) {
            // it is google authorization (detected by URL parameters)
            console.log('google authorization completed', sessionIdFromParams);
            updateLoginData(dispatch, sessionIdFromParams, false);
            history.pushState({}, null, `http://${location.host}`);
        } else {
            if (errorFromParams) {
                // it is error from google authorization page (detected by URL parameters)
                console.log('google authorization failed', errorFromParams);
                dispatch(loginError(errorFromParams));
                dispatch(handleError(null, LOGIN_GOOGLE_ERROR, null));
                history.pushState({}, null, `http://${location.host}`);
            }
            // try to restore old session
            checkCookieSessionAndLogin(dispatch);
        }
    }
}

export function logout() {
    const sessionId = getCookie('sessionId');
    sessionsClient.closeSession(sessionId, (error, response) => {
        if (error || response.status !== HttpStatus.OK) {
            // We close session on the frontend and don't care about returned
            // status, becouse now it is problem of the web server
            message = error || response.body;
            console.log('cannot close session', sessionId, message);
        } else {
            console.log('session closed', sessionId);
        }
        location.replace(location.origin);
    });
}
