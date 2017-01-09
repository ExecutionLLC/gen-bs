import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';
import {clearVariants, addComment, changeComment, deleteComment} from './websocket';
import {requestTableScrollPositionReset} from './ui';

/*
 * action types
 */

export const CHANGE_VARIANTS_GLOBAL_FILTER = 'CHANGE_VARIANTS_GLOBAL_FILTER';
export const SET_FIELD_FILTER = 'SET_FIELD_FILTER';
export const CHANGE_VARIANTS_SORT = 'CHANGE_VARIANTS_SORT';
export const SET_VARIANTS_SORT = 'SET_VARIANTS_SORT';
export const CLEAR_SEARCH_PARAMS = 'CLEAR_SEARCH_PARAMS';

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW';
export const CLEAR_VARIANTS_ROWS_SELECTION = 'CLEAR_VARIANTS_ROWS_SELECTION';

export const REQUEST_VARIANTS = 'REQUEST_VARIANTS';
export const RECEIVE_ANALYSIS_OPERATION_ID = 'RECEIVE_ANALYSIS_OPERATION_ID';

export const REQUEST_SEARCHED_RESULTS = 'REQUEST_SEARCHED_RESULTS';
export const RECEIVE_SEARCHED_RESULTS = 'RECEIVE_SEARCHED_RESULTS';

export const CHANGE_VARIANTS_LIMIT = 'CHANGE_VARIANTS_LIMIT';

const ANALYZE_SAMPLE_ERROR_MESSAGE = 'Cannot analyze data. Please try again.';
const NEXT_DATA_ERROR_MESSAGE = 'Cannot get next part of data. Please try again.';
const SEARCH_IN_RESULTS_ERROR_MESSAGE = 'Cannot analyze results. Please try again.';
const ADD_COMMENT_ERROR_MESSAGE = 'Cannot add commentary. Please try again.';
const UPDATE_COMMENT_ERROR_MESSAGE = 'Cannot update commentary. Please try again.';
const DELETE_COMMENT_ERROR_MESSAGE = 'Cannot delete commentary. Please try again.';

const commentsClient = apiFacade.commentsClient;
const searchClient = apiFacade.searchClient;

/*
 * action creators
 */


function changeVariantsLimit() {
    return {
        type: CHANGE_VARIANTS_LIMIT
    };
}

export function getNextPartOfData() {
    return (dispatch) => {
        dispatch(changeVariantsLimit());

        setTimeout(() => {
            dispatch(searchInResultsNextDataAsync());
        }, 100);
    };
}

export function clearSearchParams() {
    return {
        type: CLEAR_SEARCH_PARAMS
    };
}

export function setFieldFilter(fieldId, sampleId, filterValue) {
    return {
        type: SET_FIELD_FILTER,
        fieldId,
        sampleId,
        filterValue
    };
}

export function sortVariants(fieldId, sampleId, sortDirection, ctrlKeyPressed) {
    return (dispatch, getState) => {
        dispatch(changeVariantsSort(fieldId, sampleId, ctrlKeyPressed ? 2 : 1, sortDirection));
        if (getState().variantsTable.needUpdate) {
            dispatch(clearVariants());
            dispatch(searchInResultsAsync({isNextDataLoading: false, isFilteringOrSorting: true}));
        }
    };
}

export function setViewVariantsSort(view, samplesInfos) {
    return (dispatch, getState) => {

        const {samplesList: {hashedArray: {hash: samplesHash}}} = getState();
        const samples = _.map(samplesInfos, (sample) => samplesHash[sample.id]);
        const samplesFieldsHashes = _.map(samples, (sample) => _.keyBy(sample.sampleFields, (value) => value.fieldId));
        const sortOrder = _(view.viewListItems)
            .filter(viewListItem => {
                return viewListItem.sortDirection != null && viewListItem.sortOrder != null;
            })
            .map(viewListItem => {
                const sampleIndex = _.findIndex(samplesFieldsHashes, (sampleFieldsHash) => sampleFieldsHash[viewListItem.fieldId]);
                if (sampleIndex < 0) {
                    return null;
                }
                const sampleId = samplesInfos[sampleIndex].id;
                return {
                    direction: viewListItem.sortDirection,
                    fieldId: viewListItem.fieldId,
                    sampleId,
                    order: viewListItem.sortOrder
                };
            })
            .filter(sort => {
                return !!sort;
            })
            .orderBy(['order'], true)
            .value();
        //Fix for the case when another sort column is missing in the sample fields.
        if (sortOrder.length == 1) {
            sortOrder[0].order = 1;
        }
        dispatch(setVariantsSort(sortOrder));
    };
}

export function setVariantsSort(sortOrder) {
    return {
        type: SET_VARIANTS_SORT,
        sortOrder
    };
}

export function changeVariantsSort(fieldId, sampleId, sortOrder, sortDirection) {
    return {
        type: CHANGE_VARIANTS_SORT,
        fieldId,
        sampleId,
        sortOrder,
        sortDirection
    };
}

export function changeVariantsGlobalFilter(globalSearchString) {
    return {
        type: CHANGE_VARIANTS_GLOBAL_FILTER,
        globalSearchString
    };
}

function requestVariants() {
    return {
        type: REQUEST_VARIANTS
    };
}

function receiveAnalysisOperationId(operationId) {
    return {
        type: RECEIVE_ANALYSIS_OPERATION_ID,
        operationId,
        receivedAt: Date.now()
    };
}


export function createCommentAsync(alt, pos, reference, chrom, searchKey, comment) {
    return (dispatch, getState) => {
        const commentObject = {
            alt,
            pos,
            reference,
            chrom,
            searchKey,
            comment
        };
        const {ui: {languageId}} = getState();
        return new Promise((resolve) => commentsClient.add(
            languageId,
            commentObject,
            (error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(ADD_COMMENT_ERROR_MESSAGE, error, response))
        ).then((response) => response.body
        ).then((comment) => dispatch(addComment(comment)));
    };
}

export function updateCommentAsync(id, alt, pos, ref, chrom, searchKey, comment) {

    return (dispatch) => {

        const commentObject = {
            id,
            alt,
            pos,
            reference: ref,
            chrom,
            searchKey,
            comment
        };
        return new Promise(
            (resolve) => commentsClient.update(commentObject, (error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(UPDATE_COMMENT_ERROR_MESSAGE, error, response))
        ).then(
            (response) => response.body
        ).then((comment) => dispatch(changeComment(comment)));
    };
}

export function removeCommentAsync(id, searchKey) {
    return (dispatch) => {
        return new Promise(
            (resolve) => commentsClient.remove(id, (error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(DELETE_COMMENT_ERROR_MESSAGE, error, response))
        ).then(
            (response) => response.body
        ).then((comment) => dispatch(deleteComment(comment, searchKey)));
    };
}

export function fetchVariantsAsync(searchParams) {
    return (dispatch, getState) => {
        console.log('fetchVariants: ', searchParams);

        dispatch(requestVariants());
        dispatch(clearTableRowsSelection());

        const {ui: {languageId}} = getState();
        const {analyze, limit, offset} = searchParams;

        const sendAPI = analyze.id ?
            searchClient.sendSearchAgainRequest.bind(searchClient, languageId, analyze.id) :
            searchClient.sendSearchRequest.bind(searchClient, languageId, analyze);

        return new Promise(
            (resolve) => sendAPI(limit, offset, (error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(ANALYZE_SAMPLE_ERROR_MESSAGE, error, response))
        ).then(({body}) => {
            const {operationId} = body;
            dispatch(receiveAnalysisOperationId(operationId));
            return body;
        });
    };
}

function requestSearchedResults(flags) {
    return {
        type: REQUEST_SEARCHED_RESULTS,
        isNextDataLoading: flags.isNextDataLoading,
        isFilteringOrSorting: flags.isFilteringOrSorting
    };
}

export function receiveSearchedResults(isReceivedAll) {
    return {
        type: RECEIVE_SEARCHED_RESULTS,
        receivedAt: Date.now(),
        isReceivedAll
    };
}

export function searchInResultsSortFilter() {
    return (dispatch, getState) => {
        if (getState().variantsTable.needUpdate) {
            dispatch(clearVariants());
            dispatch(searchInResultsAsync({isNextDataLoading: false, isFilteringOrSorting: true}));
        }
    };
}

export function searchInResultsNextDataAsync() {
    return (dispatch, getState) => {
        dispatch(requestSearchedResults({isNextDataLoading: true, isFilteringOrSorting: false}));

        const state = getState();
        const operationId = state.variantsTable.operationId;
        const {offset, limit} = state.variantsTable.searchInResultsParams;
        return new Promise((resolve) => searchClient.sendGetNextPartOfData(
            operationId,
            offset,
            limit,
            (error, response) => resolve({error, response})))
            .then(
                ({error, response}) => dispatch(handleApiResponseErrorAsync(NEXT_DATA_ERROR_MESSAGE, error, response))
            );
    };
}

export function searchInResultsAsync(flags) {
    return (dispatch, getState) => {
        dispatch(requestTableScrollPositionReset());
        dispatch(requestSearchedResults(flags));
        dispatch(clearTableRowsSelection());

        const state = getState();
        const operationId = state.variantsTable.operationId;
        const {search, sort, topSearch, limit, offset} = state.variantsTable.searchInResultsParams;

        return new Promise(
            (resolve) => searchClient.sendSearchInResultsRequest(
                operationId,
                topSearch,
                limit,
                offset,
                search,
                sort,
                (error, response) => resolve({error, response}))
        ).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(SEARCH_IN_RESULTS_ERROR_MESSAGE, error, response))
        );
    };
}

export function selectTableRow(rowIndex, isSelected) {
    return {
        type: SELECT_VARIANTS_ROW,
        rowIndex,
        isSelected
    };
}

export function clearTableRowsSelection() {
    return {
        type: CLEAR_VARIANTS_ROWS_SELECTION
    };
}
