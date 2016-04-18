import config from '../../config'

import apiFacade from '../api/ApiFacade';
import { closeModal } from './modalWindows';
import { handleError } from './errorHandler';
import { fetchFilters } from './userData';

import HttpStatus from 'http-status';

export const FBUILDER_SELECT_FILTER = 'FBUILDER_SELECT_FILTER';

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR';

export const FBUILDER_TOGGLE_NEW_EDIT = 'FBUILDER_TOGGLE_NEW_EDIT';

export const FBUILDER_REQUEST_UPDATE_FILTER = 'FBUILDER_REQUEST_UPDATE_FILTER';
export const FBUILDER_RECEIVE_UPDATE_FILTER = 'FBUILDER_RECEIVE_UPDATE_FILTER';

export const FBUILDER_REQUEST_CREATE_FILTER = 'FBUILDER_REQUEST_CREATE_FILTER';
export const FBUILDER_RECEIVE_CREATE_FILTER = 'FBUILDER_RECEIVE_CREATE_FILTER';

export const FBUILDER_RECEIVE_RULES = 'FBUILDER_RECEIVE_RULES';

export const FBUILDER_CHANGE_ALL = 'FBUILDER_CHANGE_ALL';

const CREATE_FILTER_NETWORK_ERROR = 'Cannot create new filter (network error). Please try again.';
const CREATE_FILTER_SERVER_ERROR = 'Cannot create new filter (server error). Please try again.';

const UPDATE_FILTER_NETWORK_ERROR = 'Cannot update filter (network error). Please try again.';
const UPDATE_FILTER_SERVER_ERROR = 'Cannot update filter (server error). Please try again.';

const filtersClient = apiFacade.filtersClient;

/*
 * Action Creators
 */

export function filterBuilderToggleNewEdit(makeNew) {
    return {
        type: FBUILDER_TOGGLE_NEW_EDIT,
        makeNew
    }
}

export function filterBuilderSelectFilter(filters, filterId) {
    return {
        type: FBUILDER_SELECT_FILTER,
        filters,
        filterId
    }
}

export function filterBuilderChangeAttr(attr) {
    return {
        type: FBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description
    }
}

function filterBuilderRequestCreateFilter() {
    return {
        type: FBUILDER_REQUEST_CREATE_FILTER
    }
}

function filterBuilderReceiveCreateFilter(json) {
    return {
        type: FBUILDER_RECEIVE_CREATE_FILTER,
        filter: json
    }
}

export function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        dispatch(filterBuilderRequestUpdateFilter());
        const editingFilter = getState().filterBuilder.editingFilter.filter;

        const {auth: {sessionId}, ui: {languageId} } = getState();
        filtersClient.add(sessionId, languageId, editingFilter, (error, response) => {
           if (error) {
               dispatch(handleError(null, CREATE_FILTER_NETWORK_ERROR));
           } else if (response.status !== HttpStatus.OK) {
               dispatch(handleError(null, CREATE_FILTER_SERVER_ERROR));
           } else {
               const result = response.body;
               dispatch(filterBuilderReceiveUpdateFilter(result));
               dispatch(closeModal('filters'));
               dispatch(fetchFilters(result.id));
           }
        });
    }
}

function filterBuilderRequestUpdateFilter() {
    return {
        type: FBUILDER_REQUEST_UPDATE_FILTER
    }
}

function filterBuilderReceiveUpdateFilter(json) {
    return {
        type: FBUILDER_RECEIVE_UPDATE_FILTER,
        filter: json
    }
}

export function filterBuilderUpdateFilter() {

    return (dispatch, getState) => {
        const state = getState();
        const selectedFilter = state.filterBuilder.selectedFilter;
        const isNotEditableFilter = _.some(['advanced', 'standard'], selectedFilter.type);

        if (state.auth.isDemo || isNotEditableFilter) {
            dispatch(closeModal('filters'));
        } else {
            const sessionId = state.auth.sessionId;
            const editingFilter = state.filterBuilder.editingFilter.filter;
            dispatch(filterBuilderRequestUpdateFilter());
            filtersClient.update(sessionId, editingFilter, (error, response) => {
                if (error) {
                    dispatch(handleError(null, UPDATE_FILTER_NETWORK_ERROR));
                } else if (response.statusCode) {
                    dispatch(handleError(null, UPDATE_FILTER_SERVER_ERROR));
                } else {
                    const result = response.body;
                    dispatch(filterBuilderReceiveUpdateFilter(result));
                    dispatch(closeModal('filters'));
                    dispatch(fetchFilters(result.id))
                }
            });
        }
    }
}

export function filterBuilderSaveAndSelectRules() {
    return (dispatch, getState) => {
        const rules = getState().filterBuilder.editingFilter.filter.rules;
        dispatch(filterBuilderRules(rules));
        if (!getState().filterBuilder.editingFilter.isNew) {
            dispatch(filterBuilderUpdateFilter());
        } else {
            dispatch(filterBuilderCreateFilter());
        }
    };
}

export function filterBuilderRules(rules) {
    return {
        type: FBUILDER_RECEIVE_RULES,
        rules,
        rPromise: function (resolve, reject) {
            resolve(777)
        }
    }
}

export function filterBuilderChangeAll(data) {
    console.log('filterBuilderChangeAll', data);
    return {
        type: FBUILDER_CHANGE_ALL,
        rules: data
    };
}

