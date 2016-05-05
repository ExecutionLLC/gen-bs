import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import {clearVariants, addComment, changeComment, deleteComment} from './websocket';
import {updateQueryHistory} from './queryHistory';
import {requestTableScrollPositionReset} from './ui';

import HttpStatus from 'http-status';

/*
 * action types
 */

export const INIT_SEARCH_IN_RESULTS_PARAMS = 'INIT_SEARCH_IN_RESULTS_PARAMS';
export const CHANGE_VARIANTS_GLOBAL_FILTER = 'CHANGE_VARIANTS_GLOBAL_FILTER';
export const SET_FIELD_FILTER = 'SET_FIELD_FILTER';
export const CHANGE_VARIANTS_SORT = 'CHANGE_VARIANTS_SORT';
export const SET_VARIANTS_SORT = 'SET_VARIANTS_SORT';
export const CLEAR_SEARCH_PARAMS = 'CLEAR_SEARCH_PARAMS';
export const SET_EXCLUDED_FIELDS = 'SET_EXCLUDED_FIELDS';

export const FILTER_VARIANTS = 'FILTER_VARIANTS';

export const SORT_VARIANTS = 'SORT_VARIANTS';

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW';
export const CLEAR_VARIANTS_ROWS_SELECTION = 'CLEAR_VARIANTS_ROWS_SELECTION';

export const REQUEST_VARIANTS = 'REQUEST_VARIANTS';
export const RECEIVE_ANALYSIS_OPERATION_ID = 'RECEIVE_ANALYSIS_OPERATION_ID';

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

const ADD_COMMENT_NETWORK_ERROR = 'Cannot add commentary (network error). Please try again.';
const ADD_COMMENT_SERVER_ERROR = 'Cannot add commentary (server error). Please try again.';

const UPDATE_COMMENT_NETWORK_ERROR = 'Cannot update commentary (network error). Please try again.';
const UPDATE_COMMENT_SERVER_ERROR = 'Cannot update commentary (server error). Please try again.';

const DELETE_COMMENT_NETWORK_ERROR = 'Cannot delete commentary (network error). Please try again.';
const DELETE_COMMENT_SERVER_ERROR = 'Cannot delete commentary (server error). Please try again.';

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

export function getNextPartOfData() {
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

export function changeExcludedFields(viewId) {
    return (dispatch, getState) => {
        const {fields:{sampleFieldsList}, userData:{views}}=getState();
        const view = _.find(views, {id: viewId});
        const mandatoryFields = _.filter(sampleFieldsList, sampleField =>sampleField.isMandatory);
        const mandatoryFieldIds = _.map(mandatoryFields, sampleField =>sampleField.id);
        const viewFieldIds = _.map(view.viewListItems, viewItem =>viewItem.fieldId);

        const excludedMandatoryFields = _.difference(mandatoryFieldIds, viewFieldIds);
        dispatch(setExcludedFields(excludedMandatoryFields))
    };
}

export function setExcludedFields(excludedFields) {
    return {
        type: SET_EXCLUDED_FIELDS,
        excludedFields
    }
}

export function setFieldFilter(fieldId, filterValue) {
    return {
        type: SET_FIELD_FILTER,
        fieldId,
        filterValue
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

export function setViewVariantsSort(view) {
    return (dispatch, getState) => {

        const {fields:{sampleIdToFieldHash}} = getState();
        const sortOrder = _(view.viewListItems)
            .filter(viewListItem => {
                return viewListItem.sortDirection != null && viewListItem.sortOrder != null;
            })
            .filter(viewListItem => {
                return sampleIdToFieldHash[viewListItem.fieldId];
            })
            .map(viewListItem => {
                return {
                    direction: viewListItem.sortDirection,
                    fieldId: viewListItem.fieldId,
                    order: viewListItem.sortOrder
                }
            })
            .sortByOrder(['order'], true)
            .value();
        //Fix for the case when another sort column is missing in the sample fields.
        if (sortOrder.length == 1) {
            sortOrder[0].order = 1;
        }
        dispatch(setVariantsSort(sortOrder));
    }
}

export function setVariantsSort(sortOrder) {
    return {
        type: SET_VARIANTS_SORT,
        sortOrder
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

function receiveAnalysisOperationId(operationId) {
    return {
        type: RECEIVE_ANALYSIS_OPERATION_ID,
        operationId,
        receivedAt: Date.now()
    }
}


export function createComment(alt, pos, reference, chrom, searchKey, comment) {

    return (dispatch, getState) => {

        const commentObject = {
            alt,
            pos,
            reference,
            chrom,
            searchKey,
            comment
        };

        const {auth: {sessionId}, ui: {languageId}} = getState();
        commentsClient.add(sessionId, languageId, commentObject,
            (error, response) => {
                if (error) {
                    dispatch(handleError(null, ADD_COMMENT_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, ADD_COMMENT_SERVER_ERROR));
                } else {
                    dispatch(addComment(response.body));
                }
            }
        );
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

        const sessionId = getState().auth.sessionId;
        commentsClient.update(sessionId, commentObject,
            (error, response) => {
                if (error) {
                    dispatch(handleError(null, UPDATE_COMMENT_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_COMMENT_SERVER_ERROR));
                } else {
                    dispatch(changeComment(response.body));
                }
            }
        );
    }
}

export function removeComment(id, searchKey) {

    return (dispatch, getState) => {
        const sessionId = getState().auth.sessionId;
        commentsClient.remove(sessionId, id,
            (error, response) => {
                if (error) {
                    dispatch(handleError(null, DELETE_COMMENT_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, DELETE_COMMENT_SERVER_ERROR));
                } else {
                    dispatch(deleteComment(response.body, searchKey));
                }
            }
        );
    }
}

export function fetchVariants(searchParams) {
    return (dispatch, getState) => {
        console.log('fetchVariants: ', searchParams);

        dispatch(requestVariants());
        dispatch(clearTableRowsSelection());

        const {auth: {sessionId}, ui: {languageId}} = getState();
        searchClient.sendSearchRequest(
            sessionId,
            languageId,
            searchParams.sampleId,
            searchParams.viewId,
            searchParams.filterId,
            searchParams.limit,
            searchParams.offset,
            (error, response) => {
                if (error) {
                    dispatch(handleError(null, ANALYZE_SAMPLE_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, ANALYZE_SAMPLE_SERVER_ERROR));
                } else {
                    const {operationId} = response.body;
                    dispatch(receiveAnalysisOperationId(operationId));
                    const state = getState();
                    dispatch(changeExcludedFields(state.websocket.variantsView.id));
                    const isDemo = state.auth.isDemo;
                    if (!isDemo) {
                        dispatch(updateQueryHistory());
                    }
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
                    dispatch(handleError(null, NEXT_DATA_NETWORK_ERROR));
                    dispatch(receiveSearchedResults());
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, NEXT_DATA_SERVER_ERROR));
                    dispatch(receiveSearchedResults());
                }
            }
        );
    }
}

export function searchInResults(flags) {
    return (dispatch, getState) => {
        dispatch(requestTableScrollPositionReset());
        dispatch(requestSearchedResults(flags));
        dispatch(clearTableRowsSelection());

        const state = getState();
        const sessionId = state.auth.sessionId;
        const operationId = state.variantsTable.operationId;
        const {search, sort, topSearch, limit, offset} = state.variantsTable.searchInResultsParams;

        searchClient.sendSearchInResultsRequest(
            sessionId,
            operationId,
            topSearch,
            limit,
            offset,
            search,
            sort,
            (error, response) => {
                if (error) {
                    dispatch(handleError(null, SEARCH_IN_RESULTS_NETWORK_ERROR));
                    dispatch(receiveSearchedResults());
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, SEARCH_IN_RESULTS_SERVER_ERROR));
                    dispatch(receiveSearchedResults());
                }
            }
        );
    }
}

export function selectTableRow(rowIndex, isSelected) {
    return {
        type: SELECT_VARIANTS_ROW,
        rowIndex,
        isSelected
    }
}

export function clearTableRowsSelection() {
    return {
        type: CLEAR_VARIANTS_ROWS_SELECTION
    };
}
