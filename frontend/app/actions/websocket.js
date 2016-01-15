/*
 * action types
 */
export const WS_CREATE_CONNECTION = 'WS_CREATE_CONNECTION'
export const WS_RECEIVE_MESSAGE = 'WS_RECEIVE_MESSAGE'
export const WS_RECEIVE_ERROR = 'WS_RECEIVE_MESSAGE'
export const WS_RECEIVE_CLOSE= 'WS_RECEIVE_MESSAGE'
export const WS_SEND_MESSAGE = 'WS_RECEIVE_MESSAGE'



/*
 * other consts
 */


/*
 * action creators
 */
export function createWsConnection(wsConn) {
  return {
    type: WS_CREATE_CONNECTION,
    wsConn
  }
}

function receiveMessage(msg) {
  return {
    type: WS_RECEIVE_MESSAGE,
    msg
  }
}

function receiveError(err) {
  return {
    type: WS_RECEIVE_ERROR,
    err 
  }
}

function receiveClose(msg) {
  return {
    type: WS_RECEIVE_CLOSE,
    msg 
  }
}

function sended(msg) {
  return {
    type: WS_SEND_MESSAGE,
    msg
  }
}

export function subscribeToWs(sid) {


  return (dispatch, getState) => {

    const conn = getState().websocket.wsConn
          console.log('sid', sid)

    conn.onopen = event => {
      conn.send({session_id: sid})
    }
    conn.onmessage = event => {dispatch(receiveMessage(JSON.stringify(event.data))) }
    conn.onerror = event => dispatch(receiveError(event.data))
    conn.onclose = event => dispatch(receiveClose(event.data))

  }
}

export function send(msg) {
  return (dispatch, getState) => {

    const conn = getState().websocket.wsConn
    conn.send(msg)
    return dispatch(sended(msg))
  }
}

