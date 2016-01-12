/*
 * action types
 */

export const RECEIVE_USERDATA = 'RECEIVE_USERDATA'
export const REQUEST_USERDATA = 'REQUEST_USERDATA'


/*
 * Other constants
 */

const USERDATA_URL = 'http://localhost:5000/api/data'



/*
 * action creators
 */


function requestUserdata() {
  return {
    type: REQUEST_USERDATA
  }
}

function receiveUserdata(json) {
  return {
    type: RECEIVE_USERDATA,
    userData: json,
    receivedAt: Date.now()
  }
}

export function fetchUserdata() {

  return dispatch => {

    dispatch(requestUserdata())

    return $.get(USERDATA_URL)
      .then(json =>
        dispatch(receiveUserdata(json))
      )

      // TODO:
      // catch any error in the network call.
  }
}

