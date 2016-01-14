import { getCookie } from '../utils/cookie'

import { fetchUserdata } from './userData'
import WebSocketClient from '../utils/WebSocketClient'
/*
 * action types
 */
export const RECEIVE_SESSION = 'RECEIVE_SESSION'
export const REQUEST_SESSION = 'REQUEST_SESSION'


/*
 * other consts
 */
const searchParams = {
  sampleId: "ce81aa10-13e3-47c8-bd10-205e97a92d69",
  viewId: 'b7ead923-9973-443a-9f44-5563d31b5073',
  filterIds: null,
  limit: 100,
  offset: 0
}
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
  var wsClient = new WebSocketClient('localhost','8888');

  $.ajaxSetup({
    headers: { "X-Session-Id": sessionId }
  });
  
  setTimeout(() => {
    console.log(wsClient.wsClient.readyState)
    wsClient.send({session_id: sessionId})
    $.ajax('http://localhost:8888/api/search', {
      'headers': {"X-Session-Id": sessionId},
      'data': JSON.stringify(searchParams),
      'type': 'POST',
      'processData': false,
      'contentType': 'application/json'
    })
    .then(json => {
      console.log('search', json)
    })
  }, 1000)
  


  document.cookie = `sessionId=${sessionId}`


  

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
    //if (sessionId && sessionId !== 'null') {
    //  dispatch(receiveSession({session_id: sessionId}))
    //} else {
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
        //}
  }
}

