import config from '../../config'
import { getCookie } from '../utils/cookie'

import { fetchUserdata } from './userData'
import { createWsConnection, subscribeToWs, send } from './websocket'
/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION'
export const REQUEST_SESSION = 'REQUEST_SESSION'




/*
 * action creators
 */
function requestSession() {
  return {
    type: REQUEST_SESSION
  }
}

function receiveSession(json) {
  const sessionId = json.session_id || null
  const isAuthenticated = (sessionId !== null) ? true:false

  
  
  document.cookie = `sessionId=${sessionId}`

  return {
    type: RECEIVE_SESSION,
    sessionId: sessionId,
    isAuthenticated: isAuthenticated,
    receivedAt: Date.now()
  }
}

export function login(name, password) {

  var processData = (dispatch, sessionId) => {
    var conn = new WebSocket(config.URLS.WS)
    dispatch(receiveSession({session_id: sessionId}))
    dispatch(createWsConnection(conn))
    dispatch(subscribeToWs(sessionId))
    $.ajaxSetup({
      headers: { "X-Session-Id": sessionId }
    });
    dispatch(fetchUserdata())
  }

  var newSession = (dispatch, cb) => {
    return $.ajax(config.URLS.SESSION, {
        'data': JSON.stringify({user_name: name, password: password}),
        'type': 'POST',
        'processData': false,
        'contentType': 'application/json'
      })
      .then(json => {
        console.log('GET new session from server', json.session_id)
        cb(dispatch, json.session_id)
      })
    // TODO:
    // catch any error in the network call.
  }

  var checkSession = (dispatch, cb, sessionId) => {
    return $.ajax(config.URLS.SESSION, {
        'type': 'PUT',
        'headers': { "X-Session-Id": sessionId },
        'processData': false,
        'contentType': 'application/json'
      })
      .done(json => {
        console.log('cookie session VALID', sessionId)
        cb(dispatch, sessionId)
      })
      .fail(json => {
        console.log('cookie session INVALID', sessionId)
        newSession(dispatch, processData)
      })
    // TODO:
    // catch any error in the network call.
  }


  return dispatch => {

    const sessionId = getCookie('sessionId')

    dispatch(requestSession())

    // null for debug purpose
    if (sessionId && sessionId !== 'null') {
        checkSession(dispatch, processData, sessionId)
    } else {
        newSession(dispatch, processData)
      }
  }
}

