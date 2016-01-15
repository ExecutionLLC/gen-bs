import { getCookie } from '../utils/cookie'

import { fetchUserdata } from './userData'
import { createWsConnection, subscribeToWs, send } from './websocket'
/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION'
export const REQUEST_SESSION = 'REQUEST_SESSION'


/*
 * other consts
 */
const SESSION_URL = 'http://localhost:8888/api/session'
const WS_URL = 'ws://localhost:8888'

//const SESSION_URL = 'http://ec2-52-91-166-29.compute-1.amazonaws.com:8080/api/session'
//const WS_URL = 'ws://ec2-52-91-166-29.compute-1.amazonaws.com:8080'


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


  return dispatch => {

    const sessionId = getCookie('sessionId')
    //const sessionId = 'e829e70b-8f89-47b0-8655-09e0b33ccc85'
    var conn = null

    dispatch(requestSession())

    // null for debug purpose
    if (sessionId && sessionId !== 'null') {
      conn = new WebSocket(WS_URL)
      console.log('cookie session', sessionId)
      dispatch(receiveSession({session_id: sessionId}))
      dispatch(createWsConnection(conn))
      dispatch(subscribeToWs(sessionId))
      $.ajaxSetup({
        headers: { "X-Session-Id": sessionId }
      });
      dispatch(fetchUserdata())
    } else {
      return $.ajax(SESSION_URL, {
          'data': JSON.stringify({user_name: name, password: password}),
          'type': 'POST',
          'processData': false,
          'contentType': 'application/json'
        })
        .then(json => {
          conn = new WebSocket(WS_URL)
          const sessionId = json.session_id
          dispatch(receiveSession(json))
          dispatch(createWsConnection(conn))
          dispatch(subscribeToWs(sessionId))
          $.ajaxSetup({
            headers: { "X-Session-Id": sessionId }
          });
          dispatch(fetchUserdata())
        })
      // TODO:
      // catch any error in the network call.
      }
  }
}

