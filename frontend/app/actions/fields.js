/*
 * action types
 */
export const RECEIVE_FIELDS = 'RECEIVE_FIELDS'
export const REQUEST_FIELDS = 'REQUEST_FIELDS'


var _fieldsUrl = (sampleId) => `http://localhost:5000/api/fields/${sampleId}`

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

  return dispatch => {

    dispatch(requestFields())

    return $.get(_fieldsUrl(sampleId))
      .then(json => {
        dispatch(receiveFields(json))
      })

      // TODO:
      // catch any error in the network call.
  }
}

