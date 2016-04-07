import HttpStatus from 'http-status';
import { handleError } from './errorHandler'
import apiFacade from '../api/ApiFacade';


export const CHANGE_SAMPLE = 'CHANGE_SAMPLE';
export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const INIT_SAMPLES_LIST = 'INIT_SAMPLES_LIST'
export const RESET_SAMPLES_LIST = 'RESET_SAMPLES_LIST'
export const UPDATE_SAMPLES_LIST = 'UPDATE_SAMPLES_LIST'


const samplesClient = apiFacade.samplesClient;
const NETWORK_ERROR = 'Network error. You can reload page and try again.'
const SERVER_ERROR = 'Internal server error. You can reload page and try again.'


/*
 * Action Creators
 */

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

export function initSamplesList(samples) {
    return {
        type: INIT_SAMPLES_LIST,
        samples: samples
    }
}

export function resetSamplesList(sampleId) {
    return {
        type: RESET_SAMPLES_LIST,
        sampleId,
    }
}

export function updateSamplesList(sampleId, updatedSample) {
    return {
        type: UPDATE_SAMPLES_LIST,
        sampleId, sampleId,
        updatedSample: updatedSample
    }
}

export function requestUpdateSampleFields(sampleId) {
    return (dispatch, getState) => {
        const {auth: {sessionId}, samplesList: {samples}} = getState();
        const currentSample = _.find(samples, {id: sampleId});
        samplesClient.update(sessionId, currentSample, (error, response) => {
            if (error) {
                dispatch(handleError(null, NETWORK_ERROR));
            } else {
                if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, SERVER_ERROR));
                } else {
                    dispatch(updateSamplesList(sampleId, response.body));
                }
            }

        });
    }
}