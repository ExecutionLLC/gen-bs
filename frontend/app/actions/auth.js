import config from '../../config'
import { getCookie } from '../utils/cookie'

import { fetchUserdata } from './userData'
import { createWsConnection, subscribeToWs, send } from './websocket'
/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION';
export const REQUEST_SESSION = 'REQUEST_SESSION';

/*
 * action creators
 */
function requestSession() {
  return {
    type: REQUEST_SESSION
  }
}

function receiveSession(json, isDemo) {
  const sessionId = json.session_id || null;
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

function _processLoginData(dispatch, sessionId, isDemo) {

  var conn = new WebSocket(config.URLS.WS);
  dispatch(receiveSession({session_id: sessionId}, isDemo))
  dispatch(createWsConnection(conn));
  dispatch(subscribeToWs(sessionId));
  $.ajaxSetup({
    headers: {
      'X-Session-Id': sessionId,
      'X-Language-Id': 'en'
    }
  });
  dispatch(fetchUserdata())
  
}

function _checkSession(dispatch, cb, sessionId){
  return $.ajax(config.URLS.SESSION, {
      'type': 'PUT',
      'headers': { "X-Session-Id": sessionId },
      'processData': false,
      'contentType': 'application/json'
    })
    .done(json => {
      console.log('cookie session VALID', sessionId);
      cb(dispatch, sessionId, json.session_type === 'DEMO')
    })
    .fail(json => {
      console.log('cookie session INVALID', sessionId);
      _newDemoSession(dispatch, _processLoginData)
    });
  // TODO:
  // catch any error in the network call.
  };

function _newDemoSession(dispatch, cb) {
  return $.ajax(config.URLS.SESSION, {
      'data': JSON.stringify({user_name: 'valarie', password: 'password'}),
      'type': 'POST',
      'processData': false,
      'contentType': 'application/json'
    })
    .then(json => {
      console.log('GET new session from server', json.session_id)
      cb(dispatch, json.session_id, true)
    });
  // TODO:
  // catch any error in the network call.
};


function _checkCookieSessionAndLogin(dispatch, sessionId) {
    dispatch(requestSession());

    // null for debug purpose
    if (sessionId && sessionId !== 'null') {
        _checkSession(dispatch, _processLoginData, sessionId, true)
    } else {
        _newDemoSession(dispatch, _processLoginData)
    }
}

export function login2() {

  console.log('query sessionId or Error', location.search.slice(1).split('='));

  const queryString = location.search.slice(1).split('=')

  const sessionId = getCookie('sessionId');

  return dispatch => {

    if (queryString[0] === 'sessionId') {
      console.log('google auth success', queryString[1])
      _processLoginData(dispatch, queryString[1], false)
    } else if (queryString[0] === 'error') {
      console.log('google auth error', decodeURIComponent(queryString[1]))
      _checkCookieSessionAndLogin(dispatch, sessionId)
    } else {
      console.log('Not from google, maybe demo may be from cookie')
      _checkCookieSessionAndLogin(dispatch, sessionId)
    }

  }
}

