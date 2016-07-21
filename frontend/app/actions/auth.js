import HttpStatus from 'http-status';
import {addTimeout, removeTimeout} from 'redux-timeout';

import config from '../../config';
import {getCookie} from '../utils/cookie';
import {getUrlParameterByName} from '../utils/stringUtils';

import {fetchUserdata} from './userData';
import {initWSConnection} from './websocket';
import {handleError} from './errorHandler';
import {clearQueryHistory} from './queryHistory';

import apiFacade from '../api/ApiFacade';
import SessionsClient from '../api/SessionsClient';

/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION';
export const REQUEST_SESSION = 'REQUEST_SESSION';

export const LOGIN_ERROR = 'LOGIN_ERROR';

export const UPDATE_AUTOLOGOUT_TIMER = 'UPDATE_AUTOLOGOUT_TIMER';

const sessionsClient = apiFacade.sessionsClient;

/*
 * login errors
 */

const LOGIN_NETWORK_ERROR = 'Authorization failed (network error). You can reload page and try again.';
const LOGIN_SERVER_ERROR = 'Authorization failed (internal server error). You can reload page and try again.';
const LOGIN_GOOGLE_ERROR = 'Google authorization failed.';

/*
 * Start keep alive task, which update session on the WS.
 */

export class KeepAliveTask {
    constructor(period) {
        this.period = period;
        this.keepAliveTaskId = null;
    }

    isRunning() {
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
                checkSession(currentSessionId, (error) => {
                    if (error) {
                        console.log('got unexpected error in keep alive task', error);
                    }
                });
            }
            // reschedule task
            this._scheduleTask();
        }, this.period);
    }
}

/*
 * action creators
 */

function requestSession() {
    return {
        type: REQUEST_SESSION
    };
}

function receiveSession(sessionId, isDemo) {
    sessionId = sessionId || null;
    const isAuthenticated = (sessionId !== null);

    return {
        type: RECEIVE_SESSION,
        sessionId: sessionId,
        isAuthenticated: isAuthenticated,
        isDemo: isDemo,
        receivedAt: Date.now()
    };
}

function loginError(errorMessage) {
    return {
        type: LOGIN_ERROR,
        errorMessage
    };
}

function updateLoginData(dispatch, sessionId, isDemo) {
    dispatch(receiveSession(sessionId, isDemo));
    dispatch(initWSConnection());
    if (isDemo) {
        dispatch(clearQueryHistory());
    }
    dispatch(fetchUserdata());
}

// Create new demo session.
function openDemoSession(dispatch) {
    console.log('loginAsDemoUser');
    sessionsClient.openDemoSession((error, response) => {
        if (error) {
            dispatch(loginError(error));
            dispatch(handleError(null, LOGIN_NETWORK_ERROR));
        } else if (response.status !== HttpStatus.OK) {
            dispatch(loginError(response.body));
            dispatch(handleError(null, LOGIN_SERVER_ERROR));
        } else {
            const sessionId = SessionsClient.getSessionFromResponse(response);
            if (sessionId) {
                updateLoginData(dispatch, sessionId, true);
            } else {
                dispatch(loginError('Session id is empty'));
                dispatch(handleError(null, LOGIN_SERVER_ERROR));
            }
        }
    });
}

// Checks session state by sessionId.
function checkSession(sessionId, callback) {
    console.log('checkSession');
    sessionsClient.checkSession(sessionId, (error, response) => {
        if (!error) {
            const isValidSession = response.status === HttpStatus.OK;
            const isDemoSession = isValidSession ? response.body.sessionType === 'DEMO' : false;
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
                dispatch(handleError(null, LOGIN_NETWORK_ERROR));
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
    const sessionIdFromParams = getUrlParameterByName('sessionId');
    const errorFromParams = getUrlParameterByName('error');

    return dispatch => {
        if (!errorFromParams && sessionIdFromParams) {
            // it is google authorization (detected by URL parameters)
            console.log('google authorization completed', sessionIdFromParams);
            updateLoginData(dispatch, sessionIdFromParams, false);
            history.pushState({}, '', `${config.HTTP_SCHEME}://${location.host}`);
        } else {
            if (errorFromParams) {
                // it is error from google authorization page (detected by URL parameters)
                console.log('google authorization failed', errorFromParams);
                dispatch(loginError(errorFromParams));
                dispatch(handleError(null, LOGIN_GOOGLE_ERROR));
                history.pushState({}, '', `${config.HTTP_SCHEME}://${location.host}`);
            }
            // try to restore old session
            checkCookieSessionAndLogin(dispatch);
        }
    };
}

export function logout() {
    const sessionId = getCookie('sessionId');
    sessionsClient.closeSession(sessionId, (error, response) => {
        if (error || response.status !== HttpStatus.OK) {
            // We close session on the frontend and don't care about returned
            // status, because now it is problem of the web server
            const message = error || response.body;
            console.log('cannot close session', sessionId, message);
        } else {
            console.log('session closed', sessionId);
        }
        location.replace(location.origin);
    });
}

export function startAutoLogoutTimer() {
    return (dispatch, getState) => {
        // auto logout works only with authorized users
        if (getState().auth.isDemo) {
            return;
        }
        const secondsToAutoLogout = getState().auth.secondsToAutoLogout;
        if (secondsToAutoLogout === null) {
            // if secondsToAutoLogout !== null, then auto logout is already started
            dispatch(addTimeout(1000, UPDATE_AUTOLOGOUT_TIMER, () => {
                dispatch(updateAutoLogoutTimer());
            }));
            dispatch(updateAutoLogoutTimer());
        }
    };
}

function _updateAutoLogoutTimer(secondsToAutoLogout) {
    return {
        type: UPDATE_AUTOLOGOUT_TIMER,
        secondsToAutoLogout
    };
}

function updateAutoLogoutTimer() {
    return (dispatch, getState) => {
        const secondsToAutoLogout = getState().auth.secondsToAutoLogout;
        let nextSecondsToAutoLogout = secondsToAutoLogout === null ? config.SESSION.LOGOUT_WARNING_TIMEOUT : secondsToAutoLogout - 1;
        if (nextSecondsToAutoLogout < 0) {
            // if auto logout timer is expired, then we should start logout procedure
            dispatch(stopAutoLogoutTimer());
            logout();
            return;
        }
        // updates timer
        dispatch(_updateAutoLogoutTimer(nextSecondsToAutoLogout));
    };
}

export function stopAutoLogoutTimer() {
    // stops auto logout timer and reset auto logout state
    return (dispatch) => {
        dispatch(removeTimeout(UPDATE_AUTOLOGOUT_TIMER));
        dispatch(_updateAutoLogoutTimer(null));
    };
}
