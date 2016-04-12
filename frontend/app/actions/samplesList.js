import HttpStatus from 'http-status';
import { handleError } from './errorHandler'
import apiFacade from '../api/ApiFacade';


export const REQUEST_SAMPLES = 'REQUEST_SAMPLES';
export const RECEIVE_SAMPLES_LIST = 'RECEIVE_SAMPLES_LIST';
export const CHANGE_SAMPLE = 'CHANGE_SAMPLE';
export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const RESET_SAMPLE_IN_LIST = 'RESET_SAMPLE_IN_LIST';
export const RECEIVE_UPDATED_SAMPLE = 'RECEIVE_UPDATED_SAMPLE';

const samplesClient = apiFacade.samplesClient;
const NETWORK_ERROR = 'Network error. You can reload page and try again.';
const SERVER_ERROR = 'Internal server error. You can reload page and try again.';

const FETCH_SAMPLES_NETWORK_ERROR = 'Cannot update samples data (network error). You can reload page and try again.';
const FETCH_SAMPLES_SERVER_ERROR = 'Cannot update samples data (server error). You can reload page and try again.';


/*
 * Action Creators
 */

function requestSamples() {
    return {
        type: REQUEST_SAMPLES
    }
}

export function changeSample(sampleId) {
    return {
        type: CHANGE_SAMPLE,
        sampleId
    }
}

export function updateSampleValue(sampleId, valueFieldId, value) {
    return {
        type: UPDATE_SAMPLE_VALUE,
        sampleId,
        valueFieldId,
        value
    }
}

export function fetchSamples() {

    return (dispatch, getState) => {
        dispatch(requestSamples());

        const sessionId = getState().auth.sessionId;
        samplesClient.getAll(sessionId, (error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_SAMPLES_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_SAMPLES_SERVER_ERROR));
            } else {
                const {
                    samplesList: {
                        currentSample
                    }
                } = getState();
                const samples = response.body;

                dispatch(receiveSamplesList(samples));

                if (currentSample) {
                    dispatch(changeSample(currentSample.id));
                } else if (samples && samples.length) {
                    dispatch(changeSample(samples[0].id));
                }
            }
        });
    }
}

export function receiveSamplesList(samples) {
    return {
        type: RECEIVE_SAMPLES_LIST,
        samples: samples
    }
}

export function resetSampleInList(sampleId) {
    return {
        type: RESET_SAMPLE_IN_LIST,
        sampleId
    }
}

export function receiveUpdatedSample(sampleId, updatedSample) {
    return {
        type: RECEIVE_UPDATED_SAMPLE,
        updatedSampleId: sampleId,
        updatedSample
    }
}

export function requestUpdateSampleFields(sampleId) {
    return (dispatch, getState) => {
        const {auth: {sessionId}, samplesList: {samples, currentSample}} = getState();
        const sampleToUpdate = _.find(samples, {id: sampleId});
        samplesClient.update(sessionId, sampleToUpdate, (error, response) => {
            if (error) {
                dispatch(handleError(null, NETWORK_ERROR));
            } else {
                if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, SERVER_ERROR));
                } else {
                    const updatedSample = response.body;
                    dispatch(receiveUpdatedSample(sampleId, updatedSample));
                    // If updating current sample, remember the sample id is changed during update
                    // so select new version of the sample.
                    if (currentSample && currentSample.id === sampleId) {
                        dispatch(changeSample(updatedSample.id))
                    }
                }
            }
        });
    }
}