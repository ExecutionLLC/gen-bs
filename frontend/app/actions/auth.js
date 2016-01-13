import { getCookie } from '../utils/cookie'

import { fetchUserdata } from './userData'
/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION'
export const REQUEST_SESSION = 'REQUEST_SESSION'


const SESSION_URL = 'http://localhost:8888/api/session'
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

  $.ajaxSetup({
    headers: { "X-Session-Id": sessionId }
  });

  return dispatch => {

    dispatch(fetchUserdata())

    return {
      type: RECEIVE_SESSION,
      sessionId: sessionId,
      isAuthenticated: isAuthenticated,
      receivedAt: Date.now()
    }
  }
}

export function login(name, password) {


  return dispatch => {

    const sessionId = getCookie('sessionId')

    dispatch(requestSession())

    // null for debug purpose
    if (sessionId && sessionId !== 'null') {
      dispatch(receiveSession({session_id: sessionId}))
    } else {
      return $.ajax(SESSION_URL, {
          'data': JSON.stringify({user_name: name, password: password}),
          'type': 'POST',
          'processData': false,
          'contentType': 'application/json'
        })
        .then(json => {
          dispatch(receiveSession(json))
        })
      // TODO:
      // catch any error in the network call.
    }
  }
}

