import HttpStatus from 'http-status';

import apiFacade from '../api/ApiFacade';
import { handleError } from './errorHandler'

export const RECEIVE_QUERY_HISTORY = 'RECEIVE_QUERY_HISTORY';
export const SHOW_QUERY_HISTORY_MODAL = 'SHOW_QUERY_HISTORY_MODAL';
export const CLOSE_QUERY_HISTORY_MODAL = 'CLOSE_QUERY_HISTORY_MODAL';

const HISTORY_NETWORK_ERROR = 'Cannot update "query history" (network error).';
const HISTORY_SERVER_ERROR = 'Cannot update "query history" (server error).';

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

export function updateQueryHistory(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    return (dispatch, getState) => {
        const {auth: { sessionId }, ui: { language } } = getState();
        queryHistoryClient.getQueryHistory(sessionId, language, limit, offset, (error, response) => {
            if (error) {
                dispatch(handleError(null, HISTORY_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, HISTORY_SERVER_ERROR));
            }
        });
    }
}

export function renewHistoryItem(historyItem) {
    // Not implemented
}