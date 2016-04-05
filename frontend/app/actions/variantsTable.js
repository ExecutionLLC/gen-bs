import apiFacade from '../api/ApiFacade';
import config from '../../config'
import { clearVariants, addComment, changeComment, deleteComment } from './websocket'

import HttpStatus from 'http-status';

/*
 * action types
 */

export const INIT_SEARCH_IN_RESULTS_PARAMS = 'INIT_SEARCH_IN_RESULTS_PARAMS';
export const CHANGE_VARIANTS_GLOBAL_FILTER = 'CHANGE_VARIANTS_GLOBAL_FILTER';
export const CHANGE_VARIANTS_FILTER = 'CHANGE_VARIANTS_FILTER';
export const CHANGE_VARIANTS_SORT = 'CHANGE_VARIANTS_SORT';
export const CLEAR_SEARCH_PARAMS = 'CLEAR_SEARCH_PARAMS';

export const FILTER_VARIANTS = 'FILTER_VARIANTS';

export const SORT_VARIANTS = 'SORT_VARIANTS';

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW';

export const REQUEST_VARIANTS = 'REQUEST_VARIANTS';
export const RECEIVE_VARIANTS = 'RECEIVE_VARIANTS';

export const REQUEST_SEARCHED_RESULTS = 'REQUEST_SEARCHED_RESULTS';
export const RECEIVE_SEARCHED_RESULTS = 'RECEIVE_SEARCHED_RESULTS';

export const CHANGE_VARIANTS_LIMIT = 'CHANGE_VARIANTS_LIMIT';
export const RECEIVE_NEXT_PART_OF_DATA = 'RECEIVE_NEXT_PART_OF_DATA';

const ANALYZE_SAMPLE_NETWORK_ERROR = 'Cannot analyze data (network error). Please try again.';
const ANALYZE_SAMPLE_SERVER_ERROR = 'Cannot analyze data (server error). Please try again.';

const NEXT_DATA_NETWORK_ERROR = 'Cannot get next part of data (network error). Please try again.';
const NEXT_DATA_SERVER_ERROR = 'Cannot get next part of data (server error). Please try again.';

const SEARCH_IN_RESULTS_NETWORK_ERROR = 'Cannot analyze results (network error). Please try again.';
const SEARCH_IN_RESULTS_SERVER_ERROR = 'Cannot analyze results (server error). Please try again.';

const commentsClient = apiFacade.commentsClient;
const searchClient = apiFacade.searchClient;

/*
 * action creators
 */


function changeVariantsLimit() {
    return {
        type: CHANGE_VARIANTS_LIMIT
    }
}

export function getNextPartOfData(currentSample, currentView, currentFilter) {
    return (dispatch) => {
        dispatch(changeVariantsLimit());

        setTimeout(() => {
            dispatch(searchInResultsNextData());
        }, 100);
    }
}

export function initSearchInResultsParams(searchInResultsParams) {
    return {
        type: INIT_SEARCH_IN_RESULTS_PARAMS,
        searchInResultsParams
    }
}

export function clearSearchParams() {
    return {
        type: CLEAR_SEARCH_PARAMS
    }
}

export function changeVariantsFilter(fieldId, filterValue) {
    return {
        type: CHANGE_VARIANTS_FILTER,
        fieldId: fieldId,
        filterValue: filterValue
    }
}

export function sortVariants(fieldId, sortDirection, ctrlKeyPressed) {
    return (dispatch, getState) => {
        dispatch(changeVariantsSort(fieldId, ctrlKeyPressed ? 2 : 1, sortDirection));
        if (getState().variantsTable.needUpdate) {
            dispatch(clearVariants());
            dispatch(searchInResults({isNextDataLoading: false, isFilteringOrSorting: true}))
        }
    }
}

export function changeVariantsSort(fieldId, sortOrder, sortDirection) {
    return {
        type: CHANGE_VARIANTS_SORT,
        fieldId,
        sortOrder,
        sortDirection
    }
}

export function changeVariantsGlobalFilter(globalSearchString) {
    return {
        type: CHANGE_VARIANTS_GLOBAL_FILTER,
        globalSearchString
    }
}

function requestVariants() {
    return {
        type: REQUEST_VARIANTS
    }
}

function receiveVariants(json) {
    return {
        type: RECEIVE_VARIANTS,
        operationId: json.operation_id,
        receivedAt: Date.now()
    }
}


export function createComment(alt, pos, ref, chrom, searchKey, comment) {

    return (dispatch, getState) => {

        const commentObject = {
            alt,
            pos,
            'reference': ref,
            chrom,
            searchKey,
            comment
        };

        $.ajax(config.URLS.COMMENTS, {
                'data': JSON.stringify(commentObject),
                'type': 'POST',
                'processData': false,
                'contentType': 'application/json'
            })
            .fail(json => {
                console.log('createComment fail', json)
            })
            .then(json=> {
                dispatch(addComment(json))
            })

    }
}

export function updateComment(id, alt, pos, ref, chrom, searchKey, comment) {

    return (dispatch, getState) => {

        const commentObject = {
            id,
            alt,
            pos,
            'reference': ref,
            chrom,
            searchKey,
            comment
        };
        $.ajax(`${config.URLS.COMMENTS}/${id}`, {
                'data': JSON.stringify(commentObject),
                'type': 'PUT',
                'processData': false,
                'contentType': 'application/json'
            })
            .fail(json => {
                console.log('createComment fail', json)
            })
            .then(json => {
                dispatch(changeComment(json))
            })

    }
}

export function removeComment(id, search_key) {

    return (dispatch, getState) => {

        $.ajax(`${config.URLS.COMMENTS}/${id}`, {
                'type': 'DELETE',
                'processData': false,
                'contentType': 'application/json'
            })
            .fail(json => {
                console.log('createComment fail', json);
            })
            .then(json=> {
                console.log('createComment sucess', json);
                dispatch(deleteComment(json, search_key));
            })

    }
}

export function fetchVariants(searchParams) {
    return (dispatch, getState) => {
        console.log('fetchVariants: ', searchParams);

        dispatch(requestVariants());

        const sessionId = getState().auth.sessionId;
        searchClient.sendSearchRequest(
            sessionId,
            searchParams.sampleId,
            searchParams.viewId,
            searchParams.filterId,
            searchParams.limit,
            searchParams.offset,
            (error, response) => {
                if (error) {
                    handleError(null, ANALYZE_SAMPLE_NETWORK_ERROR);
                } else if (response.statusCode !== HttpStatus.OK) {
                    handleError(null, ANALYZE_SAMPLE_SERVER_ERROR);
                } else {
                    dispatch(receiveVariants(response.body));
                }
            }
        );
    }
}

function requestSearchedResults(flags) {
    return {
        type: REQUEST_SEARCHED_RESULTS,
        isNextDataLoading: flags.isNextDataLoading,
        isFilteringOrSorting: flags.isFilteringOrSorting
    }
}

export function receiveSearchedResults() {
    return {
        type: RECEIVE_SEARCHED_RESULTS,
        receivedAt: Date.now()
    }
}

export function searchInResultsSortFilter() {
    return (dispatch, getState) => {
        if (getState().variantsTable.needUpdate) {
            dispatch(clearVariants());
            dispatch(searchInResults({isNextDataLoading: false, isFilteringOrSorting: true}));
        }
    }
}

export function searchInResultsNextData() {
    return (dispatch, getState) => {
        dispatch(requestSearchedResults({isNextDataLoading: true, isFilteringOrSorting: false}));

        const state = getState();
        const sessionId = state.auth.sessionId;
        const operationId = state.variantsTable.operationId;
        const {offset, limit} = state.variantsTable.searchInResultsParams;

        searchClient.sendGetNextPartOfData(
            sessionId,
            operationId,
            offset,
            limit,
            (error, response) => {
                if (error) {
                    handleError(null, NEXT_DATA_NETWORK_ERROR);
                    dispatch(receiveSearchedResults());
                } else if (response.statusCode !== HttpStatus.OK) {
                    handleError(null, NEXT_DATA_SERVER_ERROR);
                    dispatch(receiveSearchedResults());
                }
            }
        );
    }
}

export function searchInResults(flags) {
    return (dispatch, getState) => {
        dispatch(requestSearchedResults(flags));

        const state = getState();
        const sessionId = state.auth.sessionId;
        const operationId = state.variantsTable.operationId;
        const { search, sort, topSearch } = state.variantsTable.searchInResultsParams;

        sendSearchInResultsRequest(
            sessionId,
            operationId,
            topSearch,
            search,
            sort,
            (error, response) => {
                if (error) {
                    handleError(null, SEARCH_IN_RESULTS_NETWORK_ERROR);
                    dispatch(receiveSearchedResults());
                } else if (response.statusCode !== HttpStatus.OK) {
                    handleError(null, SEARCH_IN_RESULTS_SERVER_ERROR);
                    dispatch(receiveSearchedResults());
                }
            }
        );
    }
}

export function selectTableRow(rowId) {
    return {
        type: SELECT_VARIANTS_ROW,
        rowId
    }
}
