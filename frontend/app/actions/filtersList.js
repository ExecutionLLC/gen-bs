import HttpStatus from 'http-status';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';

const filtersClient = apiFacade.filtersClient;

export const FILTERS_LIST_START_SERVER_OPERATION = 'FILTERS_LIST_START_SERVER_OPERATION';
export const FILTERS_LIST_END_SERVER_OPERATION = 'FILTERS_LIST_END_SERVER_OPERATION';
export const FILTERS_LIST_RECEIVE = 'FILTERS_LIST_RECEIVE';
export const FILTERS_LIST_ADD_FILTER = 'FILTERS_LIST_ADD_FILTER';
export const FILTERS_LIST_DELETE_FILTER = 'FILTERS_LIST_DELETE_FILTER';
export const FILTERS_LIST_EDIT_FILTER = 'FILTERS_LIST_EDIT_FILTER';
export const FILTERS_LIST_SET_HISTORY_FILTER = 'FILTERS_LIST_SET_HISTORY_FILTER';


const CREATE_FILTER_NETWORK_ERROR = 'Cannot create new filter (network error). Please try again.';
const CREATE_FILTER_SERVER_ERROR = 'Cannot create new filter (server error). Please try again.';

const UPDATE_FILTER_NETWORK_ERROR = 'Cannot update filter (network error). Please try again.';
const UPDATE_FILTER_SERVER_ERROR = 'Cannot update filter (server error). Please try again.';

const DELETE_FILTER_NETWORK_ERROR = 'Cannot delete filter (network error). Please try again.';
const DELETE_FILTER_SERVER_ERROR = 'Cannot delete filter (server error). Please try again.';


export function filtersListStartServerOperation() {
    return {
        type: FILTERS_LIST_START_SERVER_OPERATION
    };
}

export function filtersListEndServerOperation() {
    return {
        type: FILTERS_LIST_END_SERVER_OPERATION
    };
}

export function filtersListReceive(filters) {
    return {
        type: FILTERS_LIST_RECEIVE,
        filters
    };
}

export function filtersListAddFilter(filter) {
    return {
        type: FILTERS_LIST_ADD_FILTER,
        filter
    };
}

export function filtersListDeleteFilter(filterId) {
    return {
        type: FILTERS_LIST_DELETE_FILTER,
        filterId
    };
}

export function filtersListEditFilter(filterId, filter) {
    return {
        type: FILTERS_LIST_EDIT_FILTER,
        filterId,
        filter
    };
}

export function filtersListServerCreateFilter(filter, languageId) {
    return (dispatch) => {
        dispatch(filtersListStartServerOperation());
        return new Promise( (resolve, reject) => {
            filtersClient.add(languageId, filter, (error, response) => {
                dispatch(filtersListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, CREATE_FILTER_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, CREATE_FILTER_SERVER_ERROR));
                    reject();
                } else {
                    const newFilter = response.body;
                    dispatch(filtersListAddFilter(newFilter));
                    resolve(newFilter);
                }
            });
        });
    };
}

export function filtersListServerUpdateFilter(filter) {
    return (dispatch) => {
        dispatch(filtersListStartServerOperation());
        return new Promise( (resolve, reject) => {
            filtersClient.update(filter, (error, response) => {
                dispatch(filtersListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, UPDATE_FILTER_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_FILTER_SERVER_ERROR));
                    reject();
                } else {
                    const updatedFilter = response.body;
                    dispatch(filtersListEditFilter(filter.id, updatedFilter));
                    resolve();
                }
            });
        });
    };
}

export function filtersListServerDeleteFilter(filterId) {
    return (dispatch) => {
        dispatch(filtersListStartServerOperation());
        return new Promise( (resolve, reject) => {
            filtersClient.remove(filterId, (error, response) => {
                dispatch(filtersListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, DELETE_FILTER_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, DELETE_FILTER_SERVER_ERROR));
                    reject();
                } else {
                    dispatch(filtersListDeleteFilter(filterId));
                    resolve();
                }
            });
        });
    };
}

export function filtersListSetHistoryFilter(filter) {
    return {
        type: FILTERS_LIST_SET_HISTORY_FILTER,
        filter
    };
}