/* global reduxStore: false */

import Promise from 'bluebird';
import HttpStatus from 'http-status';
import {addTimeout, removeTimeout} from 'redux-timeout';

import config from '../../config';
import {getUrlParameterByName} from '../utils/stringUtils';

import {fetchUserDataAsync} from './userData';
import {initWSConnectionAsync, send} from './websocket';
import {handleError, handleApiResponseErrorAsync} from './errorHandler';
import {clearAnalysesHistory} from './analysesHistory';

import apiFacade from '../api/ApiFacade';
import SessionsClient from '../api/SessionsClient';

import {closeWs, TooManyWebSocketsError} from './websocket';

/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION';
export const REQUEST_SESSION = 'REQUEST_SESSION';
export const SHOW_CLOSE_ALL_USER_SESSIONS_DIALOG = 'SHOW_CLOSE_ALL_USER_SESSIONS_DIALOG';
export const SHOW_ANOTHER_PAGE_OPENED_MODAL = 'SHOW_ANOTHER_PAGE_OPENED_MODAL';
export const SET_WAITING_FOR_CLOSE_ANOTHER_PAGE_OPENED_MODAL = 'SET_WAITING_FOR_CLOSE_ANOTHER_PAGE_OPENED_MODAL';

export const LOGIN_ERROR = 'LOGIN_ERROR';

export const UPDATE_AUTOLOGOUT_TIMER = 'UPDATE_AUTOLOGOUT_TIMER';

const sessionsClient = apiFacade.sessionsClient;

export const SESSION_TYPE = {
    INVALID: 'INVALID',
    DEMO: 'DEMO',
    USER: 'USER'
};

const TOO_MANY_USER_SESSIONS_ERROR = 'TooManyUserSessions';
const PING_MESSAGE_CONTENTS = 'ping';

/*
 * login errors
 */

const LOGIN_ERROR_MESSAGE = 'Authorization failed. You can reload page and try again.';
const LOGIN_GOOGLE_ERROR = 'Google authorization failed.';
const CLOSE_ALL_USER_SESSSIONS_ERROR_MESSAGE = 'Error while closing all user sessions.';
const CLOSE_OTHER_SOCKETS_ERROR_MESSAGE = 'Error while closing other sockets. Please reload page and try again.';

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
            // update session on the web server
            return Promise.resolve()
                .then(() => this._keepAliveAsync())
                .catch((error) => console.error('got unexpected error in keep alive task', error))
                // reschedule task
                .then(() => this._scheduleTask());
        }, this.period);
    }

    _keepAliveAsync() {
        const {dispatch} = reduxStore;
        if (reduxStore.getState().websocket.closed) {
            console.log('Web-socket is closed, skipping keep-alive request');
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(() => console.log('Keep-alive tick.'))
            .then(() => dispatch(getCookieSessionTypeAsync()))
            .then((sessionType) => {
                if (sessionType === SESSION_TYPE.INVALID) {
                    console.error('Cookie session is invalid, redirect to login.');
                    window.location.replace(location.origin);
                }
            })
            .then(() => dispatch(send(PING_MESSAGE_CONTENTS)));
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

function receiveSession(isDemo) {
    return {
        type: RECEIVE_SESSION,
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


function restoreOldSessionAsync(isDemoSession) {
    return (dispatch) => {
        dispatch(receiveSession(isDemoSession));
        return dispatch(initWSConnectionAsync())
            .then(() => {
                if (isDemoSession) {
                    dispatch(clearAnalysesHistory());
                }
                return dispatch(fetchUserDataAsync());
            });
    };
}

function openDemoSessionAsync() {
    return (dispatch) => Promise.resolve(
    ).then(() => new Promise(
        (resolve) => sessionsClient.openDemoSession(
            (error, response) => resolve({error, response})
        ))
    ).then(({error, response}) => dispatch(handleApiResponseErrorAsync(LOGIN_ERROR_MESSAGE, error, response))
    ).then((response) => SessionsClient.getSessionFromResponse(response)
    ).then((sessionId) => sessionId ? dispatch(restoreOldSessionAsync(true)) : dispatch([
        loginError('Session id is empty'),
        handleError(null, LOGIN_ERROR_MESSAGE)
    ]));
}

export function openUserSession(login, password) {
    return (dispatch) => Promise.resolve(

    ).then(() => new Promise(
        (resolve) => sessionsClient.openUserSession(
            login, password, (error, response) => resolve({error, response})
        ))
    ).then(({error, response}) => dispatch(handleApiResponseErrorAsync(LOGIN_ERROR_MESSAGE, error, response))
    ).then(() => location.replace(location.origin));
}


/**@callback CheckSessionCallback
 * @param {(Error|null)}error
 * @param {boolean}[isValidSession]
 * @param {boolean}[isDemoSession]
 */
/**
 *  Checks current session state.
 */
function getCookieSessionTypeAsync() {
    return () => {
        return Promise.fromCallback(
            (done) => sessionsClient.checkSession(done)
        ).then((response) => {
            const {status, body} = response;

            if (status !== HttpStatus.OK) {
                return SESSION_TYPE.INVALID;
            }
            switch (body.sessionType) {
                case SESSION_TYPE.USER:
                case SESSION_TYPE.DEMO:
                    return body.sessionType;
                default:
                    return Promise.reject(new Error('Unknown session type'));
            }
        }).catch((error) => {
            console.error(`Error when determining session type: ${error}, consider session invalid.`);
            Promise.resolve(SESSION_TYPE.INVALID);
        });
    };
}


function displayErrorFromParamsAsync() {
    return (dispatch) => Promise.resolve()
        .then(() => {
            const errorFromParams = getUrlParameterByName('error');
            if (errorFromParams) {
                console.log('authorization failed', errorFromParams);
                history.pushState({}, '', `${config.HTTP_SCHEME}://${location.host}`);
                if (errorFromParams.toLowerCase() === TOO_MANY_USER_SESSIONS_ERROR.toLowerCase()) {
                    dispatch(showCloseAllUserSessionsDialog(true));
                    return Promise.reject(new Error(TOO_MANY_USER_SESSIONS_ERROR));
                } else {
                    dispatch(loginError(errorFromParams));
                    dispatch(handleError(null, LOGIN_GOOGLE_ERROR));
                }
            }
            return Promise.resolve();
        });
}


export function loginWithGoogle() {
    return dispatch => Promise.resolve(
        // Display auth error from params if any
    ).then(() => dispatch(displayErrorFromParamsAsync())
    ).then(() => {
        // try to restore old session
        dispatch(requestSession());
        return dispatch(
            getCookieSessionTypeAsync()
        ).then((sessionType) => {
            if (sessionType !== SESSION_TYPE.INVALID) {
                // restore old session
                return dispatch(restoreOldSessionAsync(sessionType === SESSION_TYPE.DEMO))
                    .catch((error) => {
                        if (error.code !== TooManyWebSocketsError.CODE) {
                            dispatch(handleError(null, error.message));
                        } else {
                            dispatch(showAnotherPageOpenedModal(true));
                        }
                        return Promise.reject(error);
                    });
            } else {
                // old session is invalid, so we create new one
                return dispatch(openDemoSessionAsync());
            }
        });
    });
}


export function logout() {
    return (dispatch) => {
        dispatch(closeWs());
        sessionsClient.closeSession((error, response) => {
            if (error || response.status !== HttpStatus.OK) {
                // We close session on the frontend and don't care about returned
                // status, because now it is problem of the web server
                const message = error || response.body;
                console.log('cannot close session', message);
            } else {
                console.log('session closed');
            }
            location.replace(location.origin);
        });
    };
}

export function showCloseAllUserSessionsDialog(shouldShow) {
    return {
        type: SHOW_CLOSE_ALL_USER_SESSIONS_DIALOG,
        shouldShow
    };
}

export function closeAllUserSessionsAsync() {
    return (dispatch) => {
        return new Promise(
            (resolve) => sessionsClient.closeAllUserSessions((error, response) => resolve({error, response}))
        ).then(({error, response}) => dispatch(
            handleApiResponseErrorAsync(CLOSE_ALL_USER_SESSSIONS_ERROR_MESSAGE, error, response)
        ));
    };
}

export function showAnotherPageOpenedModal(shouldShow) {
    return {
        type: SHOW_ANOTHER_PAGE_OPENED_MODAL,
        shouldShow
    };
}

export function setWaitStateForModal() {
    return {
        type: SET_WAITING_FOR_CLOSE_ANOTHER_PAGE_OPENED_MODAL
    };
}

export function closeOtherSocketsAsync() {
    return (dispatch) => {
        return new Promise((resolve) => sessionsClient.closeOtherSockets(
            (error, response) => resolve({error, response}))
        ).then(({error, response}) => dispatch(
            handleApiResponseErrorAsync(CLOSE_OTHER_SOCKETS_ERROR_MESSAGE, error, response))
        ).then(() => dispatch(loginWithGoogle()));
    };
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
            dispatch(logout());
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
