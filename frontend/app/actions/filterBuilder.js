import config from '../../config'

import apiFacade from '../api/ApiFacade';
import {closeModal} from './modalWindows';

import {addFilter, deleteFilter, editFilter} from "./userData";
import {changeFilter} from "./ui";
import {filterUtils} from "../utils/filterUtils";
import {
    filtersListSelectFilter,
    filtersListServerCreateFilter,
    filtersListServerUpdateFilter,
    filtersListServerDeleteFilter
} from "./filtersList";

export const FBUILDER_SELECT_FILTER = 'FBUILDER_SELECT_FILTER';

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR';
export const FBUILDER_CHANGE_FILTER = 'FBUILDER_CHANGE_FILTER';

export const FBUILDER_TOGGLE_NEW_EDIT = 'FBUILDER_TOGGLE_NEW_EDIT';

export const FBUILDER_REQUEST_UPDATE_FILTER = 'FBUILDER_REQUEST_UPDATE_FILTER';
export const FBUILDER_RECEIVE_UPDATE_FILTER = 'FBUILDER_RECEIVE_UPDATE_FILTER';

export const FBUILDER_RECEIVE_RULES = 'FBUILDER_RECEIVE_RULES';


/*
 * Action Creators
 */

export function filterBuilderToggleNewEdit(makeNew, fields) {
    return {
        type: FBUILDER_TOGGLE_NEW_EDIT,
        makeNew,
        fields
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

export function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        dispatch(filterBuilderRequestUpdateFilter());//remove later
        const editingFilter = getState().filterBuilder.editingFilter.filter;

        const {auth: {sessionId}, ui: {languageId} } = getState();
        dispatch(filtersListServerCreateFilter(editingFilter, sessionId, languageId))
            .then( (newFilter) => {

                // remove later
                if (newFilter) {
                    dispatch(filterBuilderReceiveUpdateFilter(newFilter));
                    dispatch(addFilter(newFilter));
                    dispatch(changeFilter(newFilter.id));
                }

                dispatch(closeModal('filters'));
            });
/*
        dispatch(filtersListStartServerOperation());
        filtersClient.add(sessionId, languageId, editingFilter, (error, response) => {
           dispatch(filtersListEndServerOperation());
           if (error) {
               dispatch(handleError(null, CREATE_FILTER_NETWORK_ERROR));
           } else if (response.status !== HttpStatus.OK) {
               dispatch(handleError(null, CREATE_FILTER_SERVER_ERROR));
           } else {
               const result = response.body;
               dispatch(filterBuilderReceiveUpdateFilter(result));
               const filterId = result.id;
               dispatch(addFilter(result));
               dispatch(filtersListAddFilter(result));
               dispatch(changeFilter(filterId));
               dispatch(filtersListSelectFilter(filterId));
               dispatch(closeModal('filters'));
           }
        });
*/
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
        const editingFilter = state.filterBuilder.editingFilter;
        const originalFilter = state.filterBuilder.originalFilter;
        const isNotEdited = _.includes(['advanced', 'standard'], selectedFilter.type)
            || originalFilter.parsedFilter === editingFilter.parsedFilter;

        if (state.auth.isDemo || isNotEdited) {
            dispatch(changeFilter(editingFilter.filter.id));//remove later
            dispatch(filtersListSelectFilter(editingFilter.filter.id));
            dispatch(closeModal('filters'));
        } else {
            const sessionId = state.auth.sessionId;
            const resultEditingFilter = editingFilter.filter;
            dispatch(filterBuilderRequestUpdateFilter());//remove later
            dispatch(filtersListServerUpdateFilter(resultEditingFilter, sessionId))
                .then( (updatedFilter) => {

                    // remove later
                    if (updatedFilter) {
                        dispatch(filterBuilderReceiveUpdateFilter(updatedFilter));
                        dispatch(editFilter(editingFilter.filter.id, updatedFilter));
                        dispatch(changeFilter(updatedFilter.id));
                    }

                    dispatch(closeModal('filters'));
                });
/*
            dispatch(filterBuilderRequestUpdateFilter());
            dispatch(filtersListStartServerOperation());
            filtersClient.update(sessionId, resultEditingFilter, (error, response) => {
                dispatch(filtersListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, UPDATE_FILTER_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_FILTER_SERVER_ERROR));
                } else {
                    const result = response.body;
                    dispatch(filterBuilderReceiveUpdateFilter(result));
                    dispatch(editFilter(editingFilter.filter.id, result));
                    dispatch(filtersListEditFilter(editingFilter.filter.id, result));
                    dispatch(changeFilter(result.id));
                    dispatch(filtersListSelectFilter(result.id));
                    dispatch(closeModal('filters'));
                }
            });
*/
        }
    }
}

export function filterBuilderSaveAndSelectRules() {
    return (dispatch, getState) => {
        const parsedRules = getState().filterBuilder.editingFilter.parsedFilter;
        const rules = filterUtils.getGenomics(parsedRules);
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
        rules
    }
}

export function filterBuilderChangeFilter(index, change) {
    return {
        type: FBUILDER_CHANGE_FILTER,
        index,
        change
    };
}

export function filterBuilderDeleteFilter(filterId) {
    return (dispatch, getState) => {
        //dispatch(filterBuilderRequestDeleteFilter(filterId));//did not implemented
        const {auth: {sessionId}, fields} = getState();
        dispatch(filtersListServerDeleteFilter(filterId, sessionId))
            .then( (success)=> {

                //remove later
                if (success) {
                    //dispatch(filterBuilderReceiveDeleteFilter(null));//did not implemented // argument did not used
                    dispatch(deleteFilter(filterId));
                    const state = getState();
                    const selectedFilterId = state.ui.selectedFilter.id;
                    const newFilterId = (filterId == selectedFilterId) ? state.userData.filters[0].id : selectedFilterId;
                    dispatch(changeFilter(newFilterId));
                    dispatch(filterBuilderToggleNewEdit(false, fields));
                }
            });
/*
        dispatch(filtersListStartServerOperation());
        filtersClient.remove(sessionId, filterId, (error, response) => {
            dispatch(filtersListEndServerOperation());
            if (error) {
                dispatch(handleError(null, DELETE_FILTER_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, DELETE_FILTER_SERVER_ERROR));
            } else {
                const result = response.body;
                dispatch(filterBuilderReceiveDeleteFilter(result));
                dispatch(deleteFilter(result.id));
                dispatch(filtersListDeleteFilter(result.id));
                const state = getState();
                const selectedFilterId = state.ui.selectedFilter.id;
                const newFilterId = (result.id == selectedFilterId) ? state.userData.filters[0].id : selectedFilterId;
                dispatch(changeFilter(newFilterId));
                dispatch(filterBuilderToggleNewEdit(false, fields));
            }
        });
*/
    }
}
