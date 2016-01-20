import config from '../../config'
import { analyze, changeSample, changeView, changeFilter } from './ui'
import { fetchFields, fetchSourceFields } from './fields'

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA'
export const REQUEST_USERDATA = 'REQUEST_USERDATA'

export const RECEIVE_VIEWS = 'RECEIVE_VIEWS'
export const REQUEST_VIEWS= 'REQUEST_VIEWS'



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
        dispatch(receiveUserdata(json))
        dispatch(changeView(view.id))
        dispatch(changeFilter(filter.id))
        dispatch(changeSample(json.samples, sample.id))
        //dispatch(analyze(sample.id, view.id, filter.id))
        dispatch(fetchFields(sampleId))
        dispatch(fetchSourceFields())
      })

      // TODO:
      // catch any error in the network call.
  }
}

function requestViews() {
  return {
    type: REQUEST_VIEWS
  }
}

function receiveViews(json) {
  return {
    type: RECEIVE_VIEWS,
    views: json,
    receivedAt: Date.now()
  }
}

export function fetchViews(viewId) {

  return function(dispatch, getState ) {
    dispatch(requestViews())

    return $.ajax(config.URLS.VIEWS, {
        'type': 'GET',
         'headers': { "X-Session-Id": getState().auth.sessionId}
      })
      .then(function(json) {
        const view = json[0] || null
        const viewId = getState().viewBuilder.currentView.id || view.id

        dispatch(receiveViews(json))
        dispatch(changeView(viewId))
      })

      // TODO:
      // catch any error in the network call.
  }
}

