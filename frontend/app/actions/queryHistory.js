import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';

export const SET_CURRENT_QUERY_HISTORY_ID = 'SET_CURRENT_QUERY_HISTORY_ID';
export const RECEIVE_QUERY_HISTORY = 'RECEIVE_QUERY_HISTORY';
export const RECEIVE_INITIAL_QUERY_HISTORY = 'RECEIVE_INITIAL_QUERY_HISTORY';
export const ADD_QUERY_HISTORY = 'ADD_QUERY_HISTORY';
export const APPEND_QUERY_HISTORY = 'APPEND_QUERY_HISTORY';
export const REQUEST_QUERY_HISTORY = 'REQUEST_QUERY_HISTORY';
export const PREPARE_QUERY_HISTORY_TO_FILTER = 'PREPARE_QUERY_HISTORY_TO_FILTER';
export const DUPLICATE_QUERY_HISTORY_ITEM = 'DUPLICATE_QUERY_HISTORY_ITEM';
export const EDIT_QUERY_HISTORY_ITEM = 'EDIT_QUERY_HISTORY_ITEM';
export const EDIT_EXISTENT_HISTORY_ITEM = 'EDIT_EXISTENT_HISTORY_ITEM';
export const CANCEL_QUERY_HISTORY_EDIT = 'CANCEL_QUERY_HISTORY_EDIT';
export const TOGGLE_LOADING_HISTORY_DATA = 'TOGGLE_LOADING_HISTORY_DATA';
export const CREATE_NEW_HISTORY_ITEM = 'CREATE_NEW_HISTORY_ITEM';

const HISTORY_NETWORK_ERROR = 'Cannot update "query history" (network error).';
const HISTORY_SERVER_ERROR = 'Cannot update "query history" (server error).';

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

export function appendQueryHistory(filter, requestFrom, items, isReceivedAll) {
    return {
        type: APPEND_QUERY_HISTORY,
        filter,
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

export function prepareQueryHistoryToFilter(filter) {
    return {
        type: PREPARE_QUERY_HISTORY_TO_FILTER,
        filter
    };
}

export function duplicateQueryHistoryItem(historyItemId) {
    return {
        type: DUPLICATE_QUERY_HISTORY_ITEM,
        historyItemId
    };
}

export function editQueryHistoryItem(samplesList, filtersList, viewsList, modelsList, changeItem) {
    return {
        type: EDIT_QUERY_HISTORY_ITEM,
        samplesList,
        filtersList,
        viewsList,
        modelsList,
        changeItem
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

export function addQueryHistory(newHistoryItem) {
    return {
        type: ADD_QUERY_HISTORY,
        newHistoryItem
    };
}

export function requestAppendQueryHistory(filter = '', limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    return (dispatch, getState) => {
        const {ui: {language}} = getState();
        dispatch(requestQueryHistory());
        queryHistoryClient.getQueryHistory(language, filter, limit, offset, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            } else {
                dispatch(appendQueryHistory(filter, offset, response.body.result, limit > response.body.result.length));
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

/*
export function detachHistory(detachSample, detachFilter, detachView) {
        dispatch([
            changeSamples(samples) // TODO check samples change when select current
        ]);
    };
}
*/

export function toggleLoadingHistoryData(isLoading) {
    return {
        type: TOGGLE_LOADING_HISTORY_DATA,
        isLoading
    };
}