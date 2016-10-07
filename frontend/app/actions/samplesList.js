import _ from 'lodash';

import {handleApiResponseErrorAsync} from './errorHandler';
import apiFacade from '../api/ApiFacade';
import {immutableSetPathProperty, immutableGetPathProperty} from '../utils/immutable';


export const REQUEST_SAMPLES = 'REQUEST_SAMPLES';
export const RECEIVE_SAMPLES_LIST = 'RECEIVE_SAMPLES_LIST';
export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const RESET_SAMPLE_IN_LIST = 'RESET_SAMPLE_IN_LIST';
export const RECEIVE_UPDATED_SAMPLE = 'RECEIVE_UPDATED_SAMPLE';
export const SAMPLE_ON_SAVE = 'SAMPLE_ON_SAVE';
export const SAMPLES_LIST_SET_HISTORY_SAMPLES = 'SAMPLES_LIST_SET_HISTORY_SAMPLES';

const samplesClient = apiFacade.samplesClient;
const UPDATE_SAMPLE_FIELDS_ERROR_MESSAGE = 'We are really sorry, but there is an error while updating sample fields.' +
    ' Be sure we are working on resolving the issue. You can also try to reload page and try again.';
const FETCH_SAMPLES_ERROR_MESSAGE = 'We are really sorry, but there is an error while getting the list of samples' +
    ' from our server. Be sure we are working on resolving the issue. You can also try to reload page and try again.';


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

export function fetchSamplesAsync() {

    return (dispatch) => {
        dispatch(requestSamples());
        return new Promise((resolve) => samplesClient.getAll((error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(FETCH_SAMPLES_ERROR_MESSAGE, error, response))
        ).then((response) => response.body
        ).then((samples) => dispatch(receiveSamplesList(samples)));
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

export function requestUpdateSampleFieldsAsync(sampleId) {
    return (dispatch, getState) => {
        const {samplesList: {editedSamplesHash, onSaveAction, onSaveActionPropertyId}} = getState();
        const sampleToUpdate = editedSamplesHash[sampleId];
        return new Promise((resolve) => samplesClient.update(
            sampleToUpdate,
            (error, response) => resolve({error, response})
        )).then(({error, response}) => dispatch(handleApiResponseErrorAsync(UPDATE_SAMPLE_FIELDS_ERROR_MESSAGE, error, response))
        ).then((response) => response.body
        ).then((updatedSample) => {
            const selectedSampleId = immutableGetPathProperty(onSaveAction, onSaveActionPropertyId); // TODO check if
            dispatch(receiveUpdatedSample(sampleId, updatedSample));
            // If editing selected sample, don't forget to set it as current.
            if (selectedSampleId === sampleId) {
                dispatch(sampleSaveCurrent(updatedSample.id));
            }
            return updatedSample.id;
        });
    };
}

export function sampleSaveCurrent(sampleId) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionPropertyId} = getState().samplesList;
        if (!onSaveAction) {
            return;
        }
        dispatch(immutableSetPathProperty(onSaveAction, onSaveActionPropertyId, sampleId));
    };
}

export function sampleSaveCurrentIfSelected(oldSampleId, newSampleId) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionPropertyIndex, onSaveActionPropertyId, onSaveActionSelectedSamplesIds} = getState().samplesList;
        if (!onSaveAction) {
            return;
        }
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