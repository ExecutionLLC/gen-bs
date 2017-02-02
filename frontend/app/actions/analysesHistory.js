import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError, handleApiResponseErrorAsync} from './errorHandler';
import {viewsListSetHistoryView} from './viewsList';
import {filtersListSetHistoryFilter} from './filtersList';
import {modelsListSetHistoryModel} from './modelsList';
import {samplesListSetHistorySamples} from './samplesList';

export const SET_CURRENT_ANALYSES_HISTORY_ID = 'SET_CURRENT_ANALYSES_HISTORY_ID';
export const RECEIVE_ANALYSES_HISTORY = 'RECEIVE_ANALYSES_HISTORY';
export const RECEIVE_INITIAL_ANALYSES_HISTORY = 'RECEIVE_INITIAL_ANALYSES_HISTORY';
export const SET_EDITED_ANALYSES_HISTORY = 'SET_EDITED_ANALYSES_HISTORY';
export const APPEND_ANALYSES_HISTORY = 'APPEND_ANALYSES_HISTORY';
export const REQUEST_ANALYSES_HISTORY = 'REQUEST_ANALYSES_HISTORY';
export const PREPARE_ANALYSES_HISTORY_TO_SEARCH = 'PREPARE_ANALYSES_HISTORY_TO_SEARCH';
export const DUPLICATE_ANALYSES_HISTORY_ITEM = 'DUPLICATE_ANALYSES_HISTORY_ITEM';
export const EDIT_ANALYSES_HISTORY_ITEM = 'EDIT_ANALYSES_HISTORY_ITEM';
export const DELETE_ANALYSES_HISTORY_ITEM = 'DELETE_ANALYSES_HISTORY_ITEM';
export const EDIT_EXISTENT_HISTORY_ITEM = 'EDIT_EXISTENT_HISTORY_ITEM';
export const TOGGLE_LOADING_HISTORY_DATA = 'TOGGLE_LOADING_HISTORY_DATA';
export const CREATE_NEW_HISTORY_ITEM = 'CREATE_NEW_HISTORY_ITEM';

const HISTORY_ERROR_MESSAGE = 'Cannot update analyses history. Please try again.';

const GET_SAMPLE_NETWORK_ERROR = 'Cannot get sample (network error). Please try again.';
const GET_SAMPLE_SERVER_ERROR = 'Cannot get sample (server error). Please try again.';

const GET_VIEW_ERROR_MESSAGE = 'Cannot get view. Please try again.';
const GET_FILTER_ERROR_MESSAGE = 'Cannot get filter. Please try again.';
const GET_MODEL_ERROR_MESSAGE = 'Cannot get model. Please try again.';

const analysesHistoryClient = apiFacade.analysesHistoryClient;

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export function setCurrentAnalysesHistoryId(id) {
    return {
        type: SET_CURRENT_ANALYSES_HISTORY_ID,
        id
    };
}

export function createNewHistoryItem(sample, filter, view, languageId) {
    return {
        type: CREATE_NEW_HISTORY_ITEM,
        sample,
        filter,
        view,
        languageId
    };
}

export function receiveAnalysesHistory(history) {
    return {
        type: RECEIVE_ANALYSES_HISTORY,
        history
    };
}

export function receiveInitialAnalysesHistory(history) {
    return {
        type: RECEIVE_INITIAL_ANALYSES_HISTORY,
        history
    };
}

export function requestAnalysesHistory() {
    return {
        type: REQUEST_ANALYSES_HISTORY
    };
}

export function appendAnalysesHistory(search, requestFrom, items, isReceivedAll) {
    return {
        type: APPEND_ANALYSES_HISTORY,
        search,
        requestFrom,
        history: items,
        isReceivedAll
    };
}

export function clearAnalysesHistory() {
    return (dispatch) => {
        dispatch(receiveAnalysesHistory([]));
    };
}

export function prepareAnalysesHistoryToSearch(search) {
    return {
        type: PREPARE_ANALYSES_HISTORY_TO_SEARCH,
        search
    };
}

export function duplicateAnalysesHistoryItem(historyItem, languageId) {
    return {
        type: DUPLICATE_ANALYSES_HISTORY_ITEM,
        historyItem,
        languageId
    };
}

export function editAnalysesHistoryItem(samplesList, modelsList, isDemo, changeItem, languageId) {
    return {
        type: EDIT_ANALYSES_HISTORY_ITEM,
        samplesList,
        modelsList,
        isDemo,
        changeItem,
        languageId
    };
}

export function deleteAnalysesHistoryItem(historyItemId) {
    return {
        type: DELETE_ANALYSES_HISTORY_ITEM,
        historyItemId
    };
}

export function editExistentAnalysesHistoryItem(historyItem) {
    return {
        type: EDIT_EXISTENT_HISTORY_ITEM,
        historyItem
    };
}

export function setEditedHistoryItem(newHistoryItem) {
    return {
        type: SET_EDITED_ANALYSES_HISTORY,
        newHistoryItem
    };
}

export function requestAppendAnalysesHistoryAsync(search = '', limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    return (dispatch, getState) => {
        const {ui: {languageId}} = getState();
        dispatch(requestAnalysesHistory());
        return new Promise((resolve) => analysesHistoryClient.getAnalysesHistory(languageId, search, limit, offset,
            (error, response) => resolve({error, response})
        )).then(({error, response}) => dispatch(handleApiResponseErrorAsync(HISTORY_ERROR_MESSAGE, error, response))
        ).then((response) => {
            const result = response.body.result;
            dispatch(appendAnalysesHistory(search, offset, result, limit > result.length));
        }).catch(
            dispatch(appendAnalysesHistory(search, offset, [], true))
        );
    };
}

export function updateAnalysesHistoryItemAsync(historyItemId) {
    return (dispatch, getState) => {
        const {history} = getState().analysesHistory;
        const historyItem = _.find(history, (historyItem) => {
            return historyItem.id === historyItemId;
        });
        return new Promise(
            (resolve) => analysesHistoryClient.update(historyItem, (error, response) => resolve({error, response}))
        ).then(({error, response}) => dispatch(handleApiResponseErrorAsync(HISTORY_ERROR_MESSAGE, error, response))
        ).then((response) => response.body);
    };
}

export function deleteServerAnalysesHistoryItemAsync(historyItemId) {
    return (dispatch, getState) => {
        return new Promise(
            (resolve) => analysesHistoryClient.remove(historyItemId, (error, response) => resolve({
                error,
                response
            }))
        ).then(({error, response}) => dispatch(handleApiResponseErrorAsync(HISTORY_ERROR_MESSAGE, error, response))
        ).then(() => dispatch(deleteAnalysesHistoryItem(historyItemId))
        ).then(() => {
            const {analysesHistory: {currentHistoryId}} = getState();
            dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId));
        });
    };
}

export function toggleLoadingHistoryData(isLoading) {
    return {
        type: TOGGLE_LOADING_HISTORY_DATA,
        isLoading
    };
}

// TODO REFACTOR make parallel loading of history samples
function getSamples(samplesIds, samplesHash, callback) {

    function getSample(sampleId, callback) {
        const existentSample = samplesHash[sampleId];
        if (existentSample) {
            callback(null, existentSample);
        } else {
            apiFacade.samplesClient.get(sampleId, (error, response) => {
                if (error) {
                    callback(GET_SAMPLE_NETWORK_ERROR);
                } else if (response.status !== HttpStatus.OK) {
                    callback(GET_SAMPLE_SERVER_ERROR);
                } else {
                    callback(null, response.body);
                }
            });
        }
    }

    function getNextSample(samplesIds, index, samples) {
        if (index >= samplesIds.length) {
            callback(null, samples);
            return;
        }
        getSample(samplesIds[index], (error, sample) => {
            if (error) {
                callback(error);
                return;
            }
            const newSamples = [...samples, sample];
            getNextSample(samplesIds, index + 1, newSamples);
        });
    }

    getNextSample(samplesIds, 0, []);
}

// TODO REFACTOR make parallel loading of history data
// Each promise gets existing or loads absent filter/view/model and then it inserts to the according list.
// Samples inserts one-by-one by 'getSamples' function call
export function setCurrentAnalysesHistoryIdLoadDataAsync(id) {

    return (dispatch, getState) => {

        const {
            viewsList: {hashedArray: {hash: viewsHash}},
            filtersList: {hashedArray: {hash: filtersHash}},
            modelsList: {hashedArray: {hash: modelsHash}},
            samplesList: {hashedArray: {hash: samplesHash}},
            analysesHistory: {newHistoryItem, history: historyList}
        } = getState();

        const historyItem = id ? _.find(historyList, {id}) : newHistoryItem;

        function getUsedSamplesIds(samples) {
            return _(samples).map((sample) => sample.id).uniq().value();
        }

        const {viewId, filterId, modelId, samples} = historyItem;
        const samplesIds = getUsedSamplesIds(samples);

        dispatch(toggleLoadingHistoryData(true));
        return Promise.resolve(
        ).then(() => {
            const existentView = viewsHash[viewId];
            if (existentView) {
                return existentView;
            } else {
                return new Promise((resolve) => apiFacade.viewsClient.get(
                    viewId,
                    (error, response) => resolve({error, response})
                )).then(
                    ({error, response}) => dispatch(handleApiResponseErrorAsync(GET_VIEW_ERROR_MESSAGE, error, response))
                ).then((response) => response.body);
            }
        }).then((view) => {
            // TODO it is unclear that ...SetHistoryView can receive non-history item,
            // in that case it is not adding it but this call is necessary because
            // it removes old history items
            dispatch(viewsListSetHistoryView(view));
            const existentFilter = filtersHash[filterId];
            if (existentFilter) {
                return existentFilter;
            } else {
                return new Promise((resolve) => apiFacade.filtersClient.get(
                    filterId,
                    (error, response) => resolve({error, response})
                )).then(({error, response}) => dispatch(handleApiResponseErrorAsync(GET_FILTER_ERROR_MESSAGE, error, response))
                ).then((response) => response.body);
            }
        }).then((filter) => {
            dispatch(filtersListSetHistoryFilter(filter));
            if (modelId == null) {
                return null;
            }
            const existentModel = modelsHash[modelId];
            if (existentModel) {
                return existentModel;
            } else {
                return new Promise((resolve) => apiFacade.modelsClient.get(
                    modelId,
                    (error, response) => resolve({error, response}))
                ).then(({error, response}) => dispatch(handleApiResponseErrorAsync(GET_MODEL_ERROR_MESSAGE, error, response))
                ).then((response) => response.body);
            }
        }).then((model) => {
            dispatch(modelsListSetHistoryModel(model));
            return new Promise((resolve, reject) => {
                getSamples(samplesIds, samplesHash, (error, samples) => {
                    if (error) {
                        dispatch(handleError(null, error));
                        reject(error);
                    } else {
                        resolve(samples);
                    }
                });
            });
        }).then((samples) => dispatch([
            samplesListSetHistorySamples(samples),
            setCurrentAnalysesHistoryId(id),
            toggleLoadingHistoryData(false)
        ]));
    };
}
