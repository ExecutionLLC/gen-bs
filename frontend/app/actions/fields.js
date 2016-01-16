import config from '../../config'

/*
 * action types
 */
export const RECEIVE_FIELDS = 'RECEIVE_FIELDS'
export const REQUEST_FIELDS = 'REQUEST_FIELDS'


/*
 * action creators
 */
function requestFields() {
  return {
    type: REQUEST_FIELDS
  }
}

function receiveFields(json) {
  return {
    type: RECEIVE_FIELDS,
    fields: json,
    receivedAt: Date.now()
  }
}

export function fetchFields(sampleId) {

  return ( dispatch, getState )  => {

    dispatch(requestFields())

    return $.ajax(config.URLS.FIELDS(sampleId), {
        'type': 'GET',
         'headers': { "X-Session-Id": getState().auth.sessionId}
      })
      .then(json => {
        dispatch(receiveFields(json))
      })

      // TODO:
      // catch any error in the network call.
  }
}

