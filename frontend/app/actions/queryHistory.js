import HttpStatus from 'http-status';

import apiFacade from '../api/ApiFacade';
import { handleError } from './errorHandler';
import { attachHistoryData } from './userData';
import { analyze, changeSample, changeFilter, changeView } from './ui';

export const RECEIVE_QUERY_HISTORY = 'RECEIVE_QUERY_HISTORY';
export const SHOW_QUERY_HISTORY_MODAL = 'SHOW_QUERY_HISTORY_MODAL';
export const CLOSE_QUERY_HISTORY_MODAL = 'CLOSE_QUERY_HISTORY_MODAL';

const HISTORY_NETWORK_ERROR = 'Cannot update "query history" (network error).';
const HISTORY_SERVER_ERROR = 'Cannot update "query history" (server error).';
const UNKNOWN_HISTORY_ID_ERROR = 'Cannot find history item.';

const queryHistoryClient = apiFacade.queryHistoryClient;

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export function receiveQueryHistory(history) {
    return {
        type: RECEIVE_QUERY_HISTORY,
        history
    }
}

export function showQueryHistoryModal() {
    return {
        type: SHOW_QUERY_HISTORY_MODAL
    }
}

export function closeQueryHistoryModal() {
    return {
        type: CLOSE_QUERY_HISTORY_MODAL
    }
}

export function clearQueryHistory() {
    return (dispatch) => {
        dispatch(receiveQueryHistory([]));
    }
}

export function updateQueryHistory(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    return (dispatch, getState) => {
        const {auth: { sessionId }, ui: { language } } = getState();
        queryHistoryClient.getQueryHistory(sessionId, language, limit, offset, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            } else {
                dispatch(receiveQueryHistory(response.body.result));
            }
        });
    }
}

export function renewHistoryItem(historyItemId) {
    return (dispatch, getState) => {
        const { history } = getState().queryHistory;
        const historyItem = _.find(history, (historyItem) => { return historyItem.id === historyItemId; }) || null;
        if (historyItem === null) {
            dispatch(handleError(null, UNKNOWN_HISTORY_ID_ERROR));
        } else {
            // copy history item and update names of sample, view and filter. All items from history
            // should be marked as '(from history)'.
            var clonedHistoryItem = _.cloneDeep(historyItem);
            clonedHistoryItem.sample.name = clonedHistoryItem.sample.name + ' (from history)';
            clonedHistoryItem.filters[0].name = clonedHistoryItem.filters[0].name + ' (from history)';
            clonedHistoryItem.view.name = clonedHistoryItem.view.name + ' (from history)';
            dispatch(attachHistoryData(clonedHistoryItem));
            dispatch(changeSample(getState().ui.samples, clonedHistoryItem.sample.id));
            dispatch(changeFilter(clonedHistoryItem.filters[0].id));
            dispatch(changeView(clonedHistoryItem.view.id));
            dispatch(analyze(clonedHistoryItem.sample.id, clonedHistoryItem.view.id, clonedHistoryItem.filters[0].id));
        }
    }
}