import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import {viewsListSetHistoryView} from './viewsList';
import {filtersListSetHistoryFilter} from './filtersList';
import {modelsListSetHistoryModel} from './modelsList';
import {samplesListSetHistorySamples} from './samplesList';

export const SET_CURRENT_QUERY_HISTORY_ID = 'SET_CURRENT_QUERY_HISTORY_ID';
export const RECEIVE_QUERY_HISTORY = 'RECEIVE_QUERY_HISTORY';
export const RECEIVE_INITIAL_QUERY_HISTORY = 'RECEIVE_INITIAL_QUERY_HISTORY';
export const SET_EDITED_QUERY_HISTORY = 'SET_EDITED_QUERY_HISTORY';
export const APPEND_QUERY_HISTORY = 'APPEND_QUERY_HISTORY';
export const REQUEST_QUERY_HISTORY = 'REQUEST_QUERY_HISTORY';
export const PREPARE_QUERY_HISTORY_TO_SEARCH = 'PREPARE_QUERY_HISTORY_TO_SEARCH';
export const DUPLICATE_QUERY_HISTORY_ITEM = 'DUPLICATE_QUERY_HISTORY_ITEM';
export const EDIT_QUERY_HISTORY_ITEM = 'EDIT_QUERY_HISTORY_ITEM';
export const DELETE_QUERY_HISTORY_ITEM = 'DELETE_QUERY_HISTORY_ITEM';
export const EDIT_EXISTENT_HISTORY_ITEM = 'EDIT_EXISTENT_HISTORY_ITEM';
export const CANCEL_QUERY_HISTORY_EDIT = 'CANCEL_QUERY_HISTORY_EDIT';
export const TOGGLE_LOADING_HISTORY_DATA = 'TOGGLE_LOADING_HISTORY_DATA';
export const CREATE_NEW_HISTORY_ITEM = 'CREATE_NEW_HISTORY_ITEM';

const HISTORY_NETWORK_ERROR = 'Cannot update "analyses history" (network error).';
const HISTORY_SERVER_ERROR = 'Cannot update "analyses history" (server error).';

const queryHistoryClient = apiFacade.queryHistoryClient;

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export function setCurrentQueryHistoryId(id) {
    return {
        type: SET_CURRENT_QUERY_HISTORY_ID,
        id
    };
}

export function createNewHistoryItem(sample, filter, view) {
    return {
        type: CREATE_NEW_HISTORY_ITEM,
        sample,
        filter,
        view
    };
}

export function receiveQueryHistory(history) {
    return {
        type: RECEIVE_QUERY_HISTORY,
        history
    };
}

export function receiveInitialQueryHistory(history) {
    return {
        type: RECEIVE_INITIAL_QUERY_HISTORY,
        history
    };
}

export function requestQueryHistory() {
    return {
        type: REQUEST_QUERY_HISTORY
    };
}

export function appendQueryHistory(search, requestFrom, items, isReceivedAll) {
    return {
        type: APPEND_QUERY_HISTORY,
        search,
        requestFrom,
        history: items,
        isReceivedAll
    };
}

export function clearQueryHistory() {
    return (dispatch) => {
        dispatch(receiveQueryHistory([]));
    };
}

export function prepareQueryHistoryToSearch(search) {
    return {
        type: PREPARE_QUERY_HISTORY_TO_SEARCH,
        search
    };
}

export function duplicateQueryHistoryItem(historyItem) {
    return {
        type: DUPLICATE_QUERY_HISTORY_ITEM,
        historyItem
    };
}

export function editQueryHistoryItem(samplesList, filtersList, viewsList, modelsList, isDemo, changeItem) {
    return {
        type: EDIT_QUERY_HISTORY_ITEM,
        samplesList,
        filtersList,
        viewsList,
        modelsList,
        isDemo,
        changeItem
    };
}

export function deleteQueryHistoryItem(historyItemId) {
    return {
        type: DELETE_QUERY_HISTORY_ITEM,
        historyItemId
    };
}

export function editExistentQueryHistoryItem(historyItem) {
    return {
        type: EDIT_EXISTENT_HISTORY_ITEM,
        historyItem
    };
}

export function cancelQueryHistoryEdit(historyItemId) {
    return {
        type: CANCEL_QUERY_HISTORY_EDIT,
        historyItemId
    };
}

export function setEditedHistoryItem(newHistoryItem) {
    return {
        type: SET_EDITED_QUERY_HISTORY,
        newHistoryItem
    };
}

export function requestAppendQueryHistory(search = '', limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    return (dispatch, getState) => {
        const {ui: {language}} = getState();
        dispatch(requestQueryHistory());
        queryHistoryClient.getQueryHistory(language, search, limit, offset, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            } else {
                dispatch(appendQueryHistory(search, offset, response.body.result, limit > response.body.result.length));
            }
        });
    };
}

export function updateQueryHistoryItem(historyItemId) {
    return (dispatch, getState) => {
        const {history} = getState().queryHistory;
        const historyItem = _.find(history, (historyItem) => {
            return historyItem.id === historyItemId;
        });
        queryHistoryClient.update(historyItem, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            }
        });
    };
}

export function deleteServerQueryHistoryItem(historyItemId) {
    return (dispatch) => {
        queryHistoryClient.remove(historyItemId, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            } else {
                dispatch(deleteQueryHistoryItem(historyItemId));
            }
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
            callback(existentSample);
        } else {
            apiFacade.samplesClient.get(sampleId, (error, response) => {
                callback(response.body);
            });
        }
    }

    function getNextSample(samplesIds, index, samples) {
        if (index >= samplesIds.length) {
            callback(samples);
            return;
        }
        getSample(samplesIds[index], (sample) => {
            const newSamples = [...samples, sample];
            getNextSample(samplesIds, index + 1, newSamples);
        });
    }

    getNextSample(samplesIds, 0, []);
}

// TODO REFACTOR make parallel loading of history data
// Each promise gets existing or loads absent filter/view/model and then it inserts to the according list.
// Samples inserts one-by-one by 'getSamples' function call
export function setCurrentQueryHistoryIdLoadData(id) {

    return (dispatch, getState) => {

        const {
            viewsList: {hashedArray: {hash: viewsHash}},
            filtersList: {hashedArray: {hash: filtersHash}},
            modelsList: {hashedArray: {hash: modelsHash}},
            samplesList: {hashedArray: {hash: samplesHash}},
            queryHistory: {newHistoryItem, history: historyList}
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
                return new Promise((resolve) => {
                    apiFacade.viewsClient.get(viewId, (error, response) => {
                        resolve(response.body);
                    });
                });
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
                return new Promise((resolve) => {
                    apiFacade.filtersClient.get(filterId, (error, response) => {
                        resolve(response.body);
                    });
                });
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
                return new Promise((resolve) => {
                    apiFacade.modelsClient.get(modelId, (error, response) => {
                        resolve(response.body);
                    });
                });
            }
        }).then((model) => {
            dispatch(modelsListSetHistoryModel(model));
            return new Promise((resolve) => {
                getSamples(samplesIds, samplesHash, resolve);
            });
        }).then((samples) => {
            dispatch(samplesListSetHistorySamples(samples));
            dispatch(setCurrentQueryHistoryId(id));
            dispatch(toggleLoadingHistoryData(false));
        });
    };
}
