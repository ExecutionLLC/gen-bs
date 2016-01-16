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


  return dispatch => {
    console.log(config)

    const sessionId = getCookie('sessionId')
    //const sessionId = 'e829e70b-8f89-47b0-8655-09e0b33ccc85'
    var conn = null

    dispatch(requestSession())

    // null for debug purpose
    if (sessionId && sessionId !== 'null') {
      conn = new WebSocket(config.URLS.WS)
      console.log('cookie session', sessionId)
      dispatch(receiveSession({session_id: sessionId}))
      dispatch(createWsConnection(conn))
      dispatch(subscribeToWs(sessionId))
      $.ajaxSetup({
        headers: { "X-Session-Id": sessionId }
      });
      dispatch(fetchUserdata())
    } else {
      return $.ajax(config.URLS.SESSION, {
          'data': JSON.stringify({user_name: name, password: password}),
          'type': 'POST',
          'processData': false,
          'contentType': 'application/json'
        })
        .then(json => {
          conn = new WebSocket(config.URLS.WS)
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

