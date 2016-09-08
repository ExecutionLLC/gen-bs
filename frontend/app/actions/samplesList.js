import _ from 'lodash';
import HttpStatus from 'http-status';

import {handleError} from './errorHandler';
import apiFacade from '../api/ApiFacade';
import {immutableSetPathProperty} from '../utils/immutable';


export const REQUEST_SAMPLES = 'REQUEST_SAMPLES';
export const RECEIVE_SAMPLES_LIST = 'RECEIVE_SAMPLES_LIST';
export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const RESET_SAMPLE_IN_LIST = 'RESET_SAMPLE_IN_LIST';
export const RECEIVE_UPDATED_SAMPLE = 'RECEIVE_UPDATED_SAMPLE';
export const CHANGE_SAMPLES = 'CHANGE_SAMPLES';
export const SAMPLE_ON_SAVE = 'SAMPLE_ON_SAVE';
export const SAMPLES_LIST_SET_HISTORY_SAMPLES = 'SAMPLES_LIST_SET_HISTORY_SAMPLES';

const samplesClient = apiFacade.samplesClient;
const NETWORK_ERROR = 'Network error. You can reload page and try again.';
const SERVER_ERROR = 'Internal server error. You can reload page and try again.';

const FETCH_SAMPLES_NETWORK_ERROR = 'Cannot update samples data (network error). You can reload page and try again.';
const FETCH_SAMPLES_SERVER_ERROR = 'Cannot update samples data (server error). You can reload page and try again.';


/*
 * Action Creators
 */

export function samplesOnSave(selectedSamplesIds, onSaveAction, onSaveActionPropertyIndex, onSaveActionPropertyId) {
    return {
        type: SAMPLE_ON_SAVE,
        selectedSamplesIds,
        onSaveAction,
        onSaveActionPropertyIndex,
        onSaveActionPropertyId
    };
}

function requestSamples() {
    return {
        type: REQUEST_SAMPLES
    };
}

export function updateSampleValue(sampleId, valueFieldId, value) {
    return {
        type: UPDATE_SAMPLE_VALUE,
        sampleId,
        valueFieldId,
        value
    };
}

export function fetchSamples() {

    return (dispatch) => {
        dispatch(requestSamples());

        samplesClient.getAll((error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_SAMPLES_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_SAMPLES_SERVER_ERROR));
            } else {
                const samples = response.body;
                dispatch(receiveSamplesList(samples));
            }
        });
    };
}

export function receiveSamplesList(samples) {
    return {
        type: RECEIVE_SAMPLES_LIST,
        samples: samples || []
    };
}

export function resetSampleInList(sampleId) {
    return {
        type: RESET_SAMPLE_IN_LIST,
        sampleId
    };
}

export function receiveUpdatedSample(sampleId, updatedSample) {
    return {
        type: RECEIVE_UPDATED_SAMPLE,
        updatedSampleId: sampleId,
        updatedSample
    };
}

export function requestUpdateSampleFields(sampleId) {
    return (dispatch, getState) => {
        const {samplesList: {editedSamplesHash}} = getState();
        const sampleToUpdate = editedSamplesHash[sampleId];
        return new Promise((resolve, reject) => {
            samplesClient.update(sampleToUpdate, (error, response) => {
                if (error) {
                    dispatch(handleError(null, NETWORK_ERROR));
                    reject();
                } else {
                    if (response.status !== HttpStatus.OK) {
                        dispatch(handleError(null, SERVER_ERROR));
                        reject();
                    } else {
                        const updatedSample = response.body;
                        dispatch(receiveUpdatedSample(sampleId, updatedSample));
                        resolve(updatedSample);
                    }
                }
            });
        });
    };
}

export function changeSamples(samples) { // TODO remove when after functional check
    return {
        type: CHANGE_SAMPLES,
        samples
    };
}

export function sampleSaveCurrent(sample) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionPropertyId} = getState().samplesList;
        dispatch(immutableSetPathProperty(onSaveAction, onSaveActionPropertyId, sample));
    };
}

export function sampleSaveCurrentIfSelected(oldSampleId, newSampleId) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionPropertyIndex, onSaveActionPropertyId, onSaveActionSelectedSamplesIds} = getState().samplesList;
        const selectedSampleIndex = _.findIndex(onSaveActionSelectedSamplesIds, (id) => id === oldSampleId);
        if (selectedSampleIndex >= 0) {
            dispatch(
                immutableSetPathProperty(
                    immutableSetPathProperty(onSaveAction, onSaveActionPropertyId, newSampleId),
                    onSaveActionPropertyIndex,
                    selectedSampleIndex
                )
            );
        }
    };
}

export function samplesListSetHistorySamples(samples) {
    return {
        type: SAMPLES_LIST_SET_HISTORY_SAMPLES,
        samples
    };
}