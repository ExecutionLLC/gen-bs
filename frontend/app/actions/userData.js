import apiFacade from '../api/ApiFacade'
import {handleError} from './errorHandler'
import {fetchFields, fetchTotalFields} from './fields'
import {receiveSavedFilesList} from './savedFiles';
import {receiveQueryHistory} from './queryHistory';
import {analyze, changeView, changeFilter} from './ui';
import {changeSample, receiveSamplesList} from './samplesList';

import HttpStatus from 'http-status';
import * as _ from "lodash";

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA';
export const REQUEST_USERDATA = 'REQUEST_USERDATA';

export const RECEIVE_VIEWS = 'RECEIVE_VIEWS';
export const REQUEST_VIEWS = 'REQUEST_VIEWS';

export const RECEIVE_FILTERS = 'RECEIVE_FILTERS';
export const REQUEST_FILTERS = 'REQUEST_FILTERS';

export const ATTACH_HISTORY_DATA = 'ATTACH_HISTORY_DATA';
export const DETACH_HISTORY_DATA = 'DETACH_HISTORY_DATA';

const FETCH_USER_DATA_NETWORK_ERROR = 'Cannot update user data (network error). You can reload page and try again.';
const FETCH_USER_DATA_SERVER_ERROR = 'Cannot update user data (server error). You can reload page and try again.';

const FETCH_FILTERS_NETWORK_ERROR = 'Cannot update filters data (network error). You can reload page and try again.';
const FETCH_FILTERS_SERVER_ERROR = 'Cannot update filters data (server error). You can reload page and try again.';

const FETCH_VIEWS_NETWORK_ERROR = 'Cannot update views data (network error). You can reload page and try again.';
const FETCH_VIEWS_SERVER_ERROR = 'Cannot update views data (server error). You can reload page and try again.';

const dataClient = apiFacade.dataClient;
const filtersClient = apiFacade.filtersClient;
const viewsClient = apiFacade.viewsClient;

/*
 * action creators
 */

function requestUserdata() {
    return {
        type: REQUEST_USERDATA
    }
}

function receiveUserdata(json) {
    return {
        type: RECEIVE_USERDATA,
        userData: json,
        receivedAt: Date.now()
    }
}

export function fetchUserdata() {

    return (dispatch, getState) => {
        dispatch(requestUserdata());
        const {auth: {sessionId}, ui: {languageId}} = getState();
        dataClient.getUserData(sessionId, languageId, (error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_USER_DATA_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_USER_DATA_SERVER_ERROR));
            } else {
                const result = response.body;
                const view = _.find(result.views, view => view.type == 'standard');
                const sample = result.samples[0] || null;
                const sampleId = sample ? sample.id : null;
                const filter = _.find(result.filters, filter => filter.type == 'standard');
                dispatch(receiveUserdata(result));
                dispatch(changeView(view.id));
                dispatch(changeFilter(filter.id));
                dispatch(receiveSavedFilesList(result.savedFiles));
                dispatch(analyze(sampleId, view.id, filter.id));
                dispatch(fetchFields(sampleId));
                dispatch(fetchTotalFields());
                dispatch(receiveSamplesList(result.samples));
                dispatch(changeSample(sampleId));
                dispatch(receiveQueryHistory(result.queryHistory));
            }
        });
    }
}

function requestViews() {
    return {
        type: REQUEST_VIEWS
    }
}

function receiveViews(json) {
    return {
        type: RECEIVE_VIEWS,
        views: json,
        receivedAt: Date.now()
    }
}

export function fetchViews() {

    return (dispatch, getState) => {
        dispatch(requestViews());

        const sessionId = getState().auth.sessionId;
        viewsClient.getAll(sessionId, (error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_VIEWS_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_VIEWS_SERVER_ERROR));
            } else {
                const result = response.body;
                const view = result[0] || null;
                const viewId = getState().viewBuilder.currentView.id || view.id;

                dispatch(receiveViews(result));
                dispatch(changeView(viewId));
            }
        });
    }
}

function requestFilters() {
    return {
        type: REQUEST_FILTERS
    }
}

function receiveFilters(json) {
    return {
        type: RECEIVE_FILTERS,
        filters: json,
        receivedAt: Date.now()
    }
}

export function fetchFilters() {

    return (dispatch, getState) => {
        dispatch(requestFilters());

        const sessionId = getState().auth.sessionId;
        filtersClient.getAll(sessionId, (error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_FILTERS_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_FILTERS_SERVER_ERROR));
            } else {
                const result = response.body;
                const filter = result[0] || null;
                const filterId = getState().filterBuilder.currentFilter.id || filter.id;

                dispatch(receiveFilters(result));
                dispatch(changeFilter(filterId));
            }
        });
    }
}

export function attachHistoryData(historyItem) {
    return {
        type: ATTACH_HISTORY_DATA,
        sample: historyItem.sample,
        view: historyItem.view,
        filters: historyItem.filters
    }
}

export function detachHistoryData(detachSample, detachFilter, detachView) {
    return {
        type: DETACH_HISTORY_DATA,
        detachSample,
        detachFilter,
        detachView
    }
}