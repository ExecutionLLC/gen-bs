import _ from 'lodash';

import {handleApiResponseErrorAsync} from './errorHandler';
import apiFacade from '../api/ApiFacade';
import {
    immutableSetPathProperty,
    immutableGetPathProperty
} from '../utils/immutable';
import {setCurrentAnalysesHistoryIdLoadDataAsync} from './analysesHistory';
import {changeFileUploadProgressState, fileUploadStatus} from './fileUpload';
import {entityType} from '../utils/entityTypes';
import * as i18n from '../utils/i18n';


export const REQUEST_SAMPLES = 'REQUEST_SAMPLES';
export const RECEIVE_SAMPLES_LIST = 'RECEIVE_SAMPLES_LIST';
export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const UPDATE_SAMPLE_TEXT = 'UPDATE_SAMPLE_TEXT';
export const RESET_SAMPLE_IN_LIST = 'RESET_SAMPLE_IN_LIST';
export const RECEIVE_UPDATED_SAMPLE = 'RECEIVE_UPDATED_SAMPLE';
export const SAMPLE_ON_SAVE = 'SAMPLE_ON_SAVE';
export const SAMPLES_LIST_SET_HISTORY_SAMPLES = 'SAMPLES_LIST_SET_HISTORY_SAMPLES';
export const DISABLE_SAMPLE_EDIT = 'DISABLE_SAMPLE_EDIT';
export const SAMPLES_LIST_ADD_OR_UPDATE_SAMPLES = 'SAMPLES_LIST_ADD_OR_UPDATE_SAMPLES';
export const SET_EDITING_SAMPLE_ID = 'SET_EDITING_SAMPLE_ID';
export const SET_CURRENT_SAMPLE_ID = 'SET_CURRENT_SAMPLE_ID';
export const SAMPLES_LIST_UPDATE_SAMPLES_FIELDS = 'SAMPLES_LIST_UPDATE_SAMPLES_FIELDS';
export const SAMPLES_LIST_REMOVE_SAMPLE = 'SAMPLES_LIST_REMOVE_SAMPLE';

const samplesClient = apiFacade.samplesClient;
const UPDATE_SAMPLE_FIELDS_ERROR_MESSAGE = 'We are really sorry, but there is an error while updating sample fields.' +
    ' Be sure we are working on resolving the issue. You can also try to reload page and try again.';
const FETCH_SAMPLES_ERROR_MESSAGE = 'We are really sorry, but there is an error while getting the list of samples' +
    ' from our server. Be sure we are working on resolving the issue. You can also try to reload page and try again.';
const DELETE_SAMPLE_ERROR_MESSAGE = 'We are really sorry, but there is an error while deleting sample.' +
    ' Be sure we are working on resolving the issue. You can also try to reload page and try again.';

/*
 * Action Creators
 */

export function samplesListAddOrUpdateSamples(samples) {
    return {
        type: SAMPLES_LIST_ADD_OR_UPDATE_SAMPLES,
        samples
    };
}

export function samplesListUpdateSamplesFields(samples) {
    return {
        type: SAMPLES_LIST_UPDATE_SAMPLES_FIELDS,
        samples
    };
}

export function setCurrentSampleId(sampleId) {
    return {
        type: SET_CURRENT_SAMPLE_ID,
        sampleId
    };
}

export function samplesOnSave(selectedSamplesIds, onSaveAction, onSaveActionPropertyIndex, onSaveActionPropertyId, onSaveActionDelete) {
    return {
        type: SAMPLE_ON_SAVE,
        selectedSamplesIds,
        onSaveAction,
        onSaveActionPropertyIndex,
        onSaveActionPropertyId,
        onSaveActionDelete
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

export function updateSampleText(sampleId, name, description, languageId) {
    return {
        type: UPDATE_SAMPLE_TEXT,
        sampleId,
        name,
        description,
        languageId
    };
}

export function fetchSamplesAsync() {

    return (dispatch) => {
        dispatch(requestSamples());
        return new Promise((resolve) => samplesClient.getAll((error, response) => resolve({
            error,
            response
        })))
            .then(
                ({error, response}) => {
                    return dispatch(handleApiResponseErrorAsync(FETCH_SAMPLES_ERROR_MESSAGE, error, response));
                }
            )
            .then((response) => response.body)
            .then((samples) => dispatch(receiveSamplesList(samples)));
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

function disableSampleEdit(sampleId, disable) {
    return {
        type: DISABLE_SAMPLE_EDIT,
        sampleId,
        disable
    };
}

export function requestUpdateSampleFieldsAsync(sampleId) {
    return (dispatch, getState) => {
        const {samplesList: {editingSample, onSaveAction, onSaveActionPropertyId}} = getState();
        if (!editingSample || editingSample.id !== sampleId) {
            return Promise.resolve();
        }
        dispatch(disableSampleEdit(sampleId, true));
        return new Promise((resolve) => samplesClient.update(
            editingSample,
            (error, response) => resolve({error, response})
        )).then(
            ({error, response}) => {
                return dispatch(handleApiResponseErrorAsync(UPDATE_SAMPLE_FIELDS_ERROR_MESSAGE, error, response));
            }
        ).then((response) => response.body
        ).then((updatedSample) => {
            dispatch(receiveUpdatedSample(sampleId, updatedSample));
            dispatch(disableSampleEdit(sampleId, false));
            // If editing selected sample, don't forget to set it as current.
            if (onSaveAction) {
                const selectedSampleId = immutableGetPathProperty(onSaveAction, onSaveActionPropertyId);
                if (selectedSampleId === sampleId) {
                    dispatch(sampleSaveCurrent(updatedSample.id));
                }
            }
            const {analysesHistory: {currentHistoryId}} = getState();
            return dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId))
                .then(() => updatedSample);
        }).catch(() => {
            dispatch(disableSampleEdit(sampleId, false));
        });
    };
}

// TODO refactor requestUpdateSampleFieldsAsync and requestUpdateSampleTextAsync, it have huge common part
export function requestUpdateSampleTextAsync(sampleId) {
    return (dispatch, getState) => {
        const {samplesList: {hashedArray: {hash}, editingSample, onSaveAction, onSaveActionPropertyId}} = getState();
        const currentEditedSample = hash[sampleId];
        if (!editingSample || editingSample.id !== sampleId) {
            return Promise.resolve();
        }
        dispatch(disableSampleEdit(sampleId, true));
        const newEditingSample = i18n.setEntityLanguageTexts(currentEditedSample, i18n.getEntityLanguageTexts(editingSample));
        return new Promise((resolve) => samplesClient.update(
            newEditingSample,
            (error, response) => resolve({error, response})
        )).then(
            ({error, response}) => {
                return dispatch(handleApiResponseErrorAsync(UPDATE_SAMPLE_FIELDS_ERROR_MESSAGE, error, response));
            }
        ).then((response) => response.body
        ).then((updatedSample) => {
            dispatch(receiveUpdatedSample(sampleId, updatedSample));
            dispatch(disableSampleEdit(updatedSample.id, false));
            // If editing selected sample, don't forget to set it as current.
            if (onSaveAction) {
                const selectedSampleId = immutableGetPathProperty(onSaveAction, onSaveActionPropertyId);
                if (selectedSampleId === sampleId) {
                    dispatch(sampleSaveCurrent(updatedSample.id));
                }
            }
            const {analysesHistory: {currentHistoryId}} = getState();
            return dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId))
                .then(() => updatedSample);
        }).catch(() => {
            dispatch(disableSampleEdit(sampleId, false));
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

function makeReplaceSampleInSaveAction(samplesList, index, sampleId) {
    const {onSaveAction, onSaveActionPropertyIndex, onSaveActionPropertyId, onSaveActionDelete} = samplesList;
    return immutableSetPathProperty(
        immutableSetPathProperty(onSaveAction || onSaveActionDelete, onSaveActionPropertyId, sampleId),
        onSaveActionPropertyIndex,
        index
    );
}

export function sampleSaveCurrentIfSelected(oldSampleId, newSampleId) {
    return (dispatch, getState) => {
        const {samplesList} = getState();
        const {onSaveAction, onSaveActionSelectedSamplesIds} = samplesList;
        if (!onSaveAction) {
            return;
        }
        const selectedSampleIndex = _.findIndex(onSaveActionSelectedSamplesIds, (id) => id === oldSampleId);
        if (selectedSampleIndex >= 0) {
            dispatch(makeReplaceSampleInSaveAction(samplesList, selectedSampleIndex, newSampleId));
        }
    };
}

export function samplesListSetHistorySamples(samples) {
    return {
        type: SAMPLES_LIST_SET_HISTORY_SAMPLES,
        samples
    };
}

export function setEditingSampleId(sampleId) {
    return {
        type: SET_EDITING_SAMPLE_ID,
        sampleId
    };
}

function samplesListRemoveSample(sampleId) {
    return {
        type: SAMPLES_LIST_REMOVE_SAMPLE,
        sampleId
    };
}

export function samplesListServerRemoveSample(sampleId) {
    return (dispatch, getState) => {
        return new Promise((resolve) => {
            samplesClient.remove(sampleId, (error, response) => resolve({error, response}));
        }).then(({error, response}) => {
            dispatch(handleApiResponseErrorAsync(DELETE_SAMPLE_ERROR_MESSAGE, error, response));
        }).then(() => {
            const {samplesList, fileUpload: {filesProcesses}} = getState();
            const {hash: samplesHash, array: samplesArray} = samplesList.hashedArray;
            const deletingSample = samplesHash[sampleId];
            if (deletingSample) {
                const fileSampleId = deletingSample.vcfFileId;
                const isLastSample = !_.some(samplesArray, (s) => s.vcfFileId === fileSampleId && s.id !== sampleId);
                if (isLastSample) {
                    const fileProcess = _.find(filesProcesses, {operationId: fileSampleId});
                    if (fileProcess) {
                        dispatch(changeFileUploadProgressState(100, fileUploadStatus.READY, fileProcess.id));
                    }
                }
            }
            const {onSaveActionDelete, onSaveActionSelectedSamplesIds} = samplesList;
            if (onSaveActionDelete && onSaveActionSelectedSamplesIds) {
                const deletedSampleIndex = _.findIndex(onSaveActionSelectedSamplesIds, analysisSampleId => analysisSampleId === sampleId);
                if (deletedSampleIndex >= 0) {
                    const newSample = _.find(samplesArray, availableSample => availableSample.type !== entityType.HISTORY && !_.includes(onSaveActionSelectedSamplesIds, availableSample.id));
                    if (newSample) {
                        dispatch(makeReplaceSampleInSaveAction(samplesList, deletedSampleIndex, newSample.id));
                    }
                }
            }
            dispatch(samplesListRemoveSample(sampleId));
        });
    };
}