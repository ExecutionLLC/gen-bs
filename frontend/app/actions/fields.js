import config from '../../config'

/*
 * action types
 */
export const REQUEST_FIELDS = 'REQUEST_FIELDS'
export const RECEIVE_FIELDS = 'RECEIVE_FIELDS'

export const REQUEST_SOURCE_FIELDS = 'REQUEST_SOURCE_FIELDS'
export const RECEIVE_SOURCE_FIELDS = 'RECEIVE_SOURCE_FIELDS'


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

    return (dispatch, getState) => {

        dispatch(requestFields())

        return $.ajax(config.URLS.FIELDS(sampleId), {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(json => {
                dispatch(receiveFields(json))
            })

        // TODO:
        // catch any error in the network call.
    }
}

function requestSourceFields() {
    return {
        type: REQUEST_SOURCE_FIELDS
    }
}

function receiveTotalFields(json) {
    return {
        type: RECEIVE_SOURCE_FIELDS,
        fields: json,
        receivedAt: Date.now()
    }
}

export function fetchSourceFields(sampleId) {

    return (dispatch, getState) => {

        dispatch(requestSourceFields())

        return $.ajax(config.URLS.TOTAL_FIELDS, {
                'type': 'GET',
                'headers': {"X-Session-Id": getState().auth.sessionId}
            })
            .then(json => {
                dispatch(receiveTotalFields(json))
            })

        // TODO:
        // catch any error in the network call.
    }
}
