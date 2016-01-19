import config from '../../config'
import { analyze, changeSample, changeView } from './ui'
import { fetchFields, fetchSourceFields } from './fields'

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA'
export const REQUEST_USERDATA = 'REQUEST_USERDATA'



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

  return (dispatch, getState ) => {

    dispatch(requestUserdata())

    return $.ajax(config.URLS.USERDATA, {
        'type': 'GET',
         'headers': { "X-Session-Id": getState().auth.sessionId}
      })
      .then(json => {
        const sampleId = json.samples[0].id || null
        const view = json.views[0] || null
        const sample = json.samples[0] || null
        const filter = json.filters[0] || null
        console.log('filter', filter)
        dispatch(receiveUserdata(json))
        dispatch(changeView(json.views, view.id))
        dispatch(changeSample(json.samples, sample.id))
        dispatch(analyze(sample.id, view.id, filter.id))
        dispatch(fetchFields(sampleId))
        dispatch(fetchSourceFields())
      })

      // TODO:
      // catch any error in the network call.
  }
}

function requestViews() {
  return {
    type: REQUEST_USERDATA
  }
}

function receiveViews(json) {
  return {
    type: RECEIVE_USERDATA,
    userData: json,
    receivedAt: Date.now()
  }
}

export function fetchViews() {

  return (dispatch, getState ) => {
    dispatch(requestViews())

    return $.ajax(config.URLS.VIEWS, {
        'type': 'GET',
         'headers': { "X-Session-Id": getState().auth.sessionId}
      })
      .then(json => {
        const view = json.views[0] || null

        dispatch(receiveViews(json))
      })

      // TODO:
      // catch any error in the network call.
  }
}

