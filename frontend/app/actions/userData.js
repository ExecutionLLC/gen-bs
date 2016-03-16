import config from '../../config'
import { analyze, changeSample, changeView, changeFilter } from './ui'
import { fetchFields, fetchSourceFields } from './fields'

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA'
export const REQUEST_USERDATA = 'REQUEST_USERDATA'

export const RECEIVE_VIEWS = 'RECEIVE_VIEWS'
export const REQUEST_VIEWS = 'REQUEST_VIEWS'

export const RECEIVE_FILTERS = 'RECEIVE_FILTERS'
export const REQUEST_FILTERS = 'REQUEST_FILTERS'

export const RECEIVE_SAMPLES = 'RECEIVE_SAMPLES'
export const REQUEST_SAMPLES = 'REQUEST_SAMPLES'


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

    return (dispatch, getState) => {

        dispatch(requestUserdata())

        return $.ajax(config.URLS.USERDATA, {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(json => {
                const view = json.views[0] || null
                const sampleId = json.samples.length ? json.samples[json.samples.length - 1].id : null
                const filter = json.filters[0] || null
                dispatch(receiveUserdata(json))
                dispatch(changeView(view.id))
                dispatch(changeFilter(filter.id))
                dispatch(changeSample(json.samples, sampleId))
                dispatch(analyze(sampleId, view.id, filter.id))
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

    return function (dispatch, getState) {
        dispatch(requestViews())

        return $.ajax(config.URLS.VIEWS, {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(function (json) {
                const view = json[0] || null
                const viewId = getState().viewBuilder.currentView.id || view.id

                dispatch(receiveViews(json))
                dispatch(changeView(viewId))
            })

        // TODO:
        // catch any error in the network call.
    }
}

function requestFilters() {
    return {
        type: REQUEST_FILTERS
    }
}

function receiveFilters(json) {
    return {
        type: RECEIVE_FILTERS,
        filters: json,
        receivedAt: Date.now()
    }
}

export function fetchFilters(filterId) {

    return function (dispatch, getState) {
        dispatch(requestFilters())

        return $.ajax(config.URLS.FILTERS, {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(function (json) {
                const filter = json[0] || null
                const filterId = getState().filterBuilder.currentFilter.id || filter.id

                dispatch(receiveFilters(json))
                dispatch(changeFilter(filterId))
            })

        // TODO:
        // catch any error in the network call.
    }
}

function requestSamples() {
    return {
        type: REQUEST_SAMPLES
    }
}

function receiveSamples(json) {
    return {
        type: RECEIVE_SAMPLES,
        samples: json,
        receivedAt: Date.now()
    }
}

export function fetchSamples() {

    return function (dispatch, getState) {
        dispatch(requestSamples())

        return $.ajax(config.URLS.SAMPLES, {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(function (json) {
                const sample = getState().ui.currentSample || json[0] || null
                const sampleId = sample.id

                dispatch(receiveSamples(json))
                dispatch(changeSample(json, sampleId))
            })

        // TODO:
        // catch any error in the network call.
    }
}
