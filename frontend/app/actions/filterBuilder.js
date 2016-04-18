import config from '../../config'

import apiFacade from '../api/ApiFacade';
import {closeModal} from './modalWindows';
import {handleError} from './errorHandler';
import {fetchFilters} from './userData';

import HttpStatus from 'http-status';
import {deleteFilter} from "./userData";
import {changeFilter} from "./ui";

export const FBUILDER_SELECT_FILTER = 'FBUILDER_SELECT_FILTER';

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR';

export const FBUILDER_TOGGLE_NEW_EDIT = 'FBUILDER_TOGGLE_NEW_EDIT';

export const FBUILDER_REQUEST_UPDATE_FILTER = 'FBUILDER_REQUEST_UPDATE_FILTER';
export const FBUILDER_RECEIVE_UPDATE_FILTER = 'FBUILDER_RECEIVE_UPDATE_FILTER';

export const FBUILDER_REQUEST_CREATE_FILTER = 'FBUILDER_REQUEST_CREATE_FILTER';
export const FBUILDER_RECEIVE_CREATE_FILTER = 'FBUILDER_RECEIVE_CREATE_FILTER';

export const FBUILDER_REQUEST_RULES = 'FBUILDER_REQUEST_RULES';
export const FBUILDER_RECEIVE_RULES = 'FBUILDER_RECEIVE_RULES';

export const FBUILDER_REQUEST_DELETE_VIEW = 'FBUILDER_REQUEST_DELETE_VIEW';
export const FBUILDER_RECEIVE_DELETE_VIEW = 'FBUILDER_RECEIVE_DELETE_VIEW';

const CREATE_FILTER_NETWORK_ERROR = 'Cannot create new filter (network error). Please try again.';
const CREATE_FILTER_SERVER_ERROR = 'Cannot create new filter (server error). Please try again.';

const UPDATE_FILTER_NETWORK_ERROR = 'Cannot update filter (network error). Please try again.';
const UPDATE_FILTER_SERVER_ERROR = 'Cannot update filter (server error). Please try again.';

const DELETE_FILTER_NETWORK_ERROR = 'Cannot delete filter (network error). Please try again.';
const DELETE_FILTER_SERVER_ERROR = 'Cannot delete filter (server error). Please try again.';

const filtersClient = apiFacade.filtersClient;

/*
 * Action Creators
 */

export function filterBuilderToggleNewEdit(editOrNew) {
    return {
        type: FBUILDER_TOGGLE_NEW_EDIT,
        editOrNew
    }
}

export function filterBuilderSelectFilter(filters, filterId, editOrNew) {
    return {
        type: FBUILDER_SELECT_FILTER,
        filters,
        filterId,
        editOrNew
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

        const {auth: {sessionId}, filterBuilder: {newFilter}, ui: {languageId}} = getState();
        filtersClient.add(sessionId, languageId, newFilter, (error, response) => {
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
            const editedFilter = state.filterBuilder.editedFilter;
            dispatch(filterBuilderRequestUpdateFilter());
            filtersClient.update(sessionId, editedFilter, (error, response) => {
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

export function filterBuilderRequestRules() {
    return {
        type: FBUILDER_REQUEST_RULES
    }
}

export function filterBuilderReceiveRules(rules) {
    return (dispatch, getState) => {
        dispatch(filterBuilderRules(rules));
        if (getState().filterBuilder.editOrNew) {
            dispatch(filterBuilderUpdateFilter());
        } else {
            dispatch(filterBuilderCreateFilter());
        }
    }
}

export function filterBuilderRules(rules) {
    return {
        type: FBUILDER_RECEIVE_RULES,
        rules,
        rulesPrepared: true,
        rPromise: function (resolve, reject) {
            resolve(777)
        }
    }
}


export function filterBuilderDeleteFilter(filterId) {
    return (dispatch, getState) => {
        dispatch(filterBuilderRequestDeleteFilter(filterId));
        const {auth: {sessionId}} = getState();
        filtersClient.remove(sessionId, filterId, (error, response) => {
            if (error) {
                dispatch(handleError(null, DELETE_FILTER_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, DELETE_FILTER_SERVER_ERROR));
            } else {
                const result = response.body;
                dispatch(filterBuilderReceiveDeleteFilter(result));
                dispatch(deleteFilter(result.id));
                const state = getState();
                const selectedFilterId = state.ui.selectedFilter.id;
                const newFilterId = (result.id == selectedFilterId) ? state.userData.filters[0].id : selectedFilterId;
                dispatch(changeFilter(newFilterId));
            }
        });
    }
}

function filterBuilderRequestDeleteFilter(filterId) {
    return {
        type: FBUILDER_REQUEST_DELETE_VIEW,
        filterId
    };
}

function filterBuilderReceiveDeleteFilter(json) {
    return {
        type: FBUILDER_RECEIVE_DELETE_VIEW,
        view: json
    }
}



