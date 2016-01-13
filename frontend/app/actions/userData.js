import { changeView } from './views'
import { fetchFields } from './fields'

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA'
export const REQUEST_USERDATA = 'REQUEST_USERDATA'


/*
 * Other constants
 */
//const USERDATA_URL = 'http://localhost:5000/api/data'
const USERDATA_URL = 'http://localhost:8888/api/data'


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
      .then(json => {
        const sampleId = json.samples[0].id || null
        const view = json.views[0] || null
        dispatch(receiveUserdata(json))
        dispatch(changeView(json.views, view.id))
        dispatch(fetchFields(sampleId))
      })

      // TODO:
      // catch any error in the network call.
  }
}

