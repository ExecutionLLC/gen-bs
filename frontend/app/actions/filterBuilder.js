import {closeModal} from './modalWindows';
import _ from 'lodash';

import {
    filtersListSelectFilter,
    filtersListServerCreateFilter,
    filtersListServerUpdateFilter,
    filtersListServerDeleteFilter
} from './filtersList';

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR';
export const FBUILDER_CHANGE_FILTER = 'FBUILDER_CHANGE_FILTER';

export const FBUILDER_START_EDIT = 'FBUILDER_START_EDIT';
export const FBUILDER_SAVE_EDIT = 'FBUILDER_SAVE_EDIT';
export const FBUILDER_END_EDIT = 'FBUILDER_END_EDIT';

export const FBUILDER_RECEIVE_RULES = 'FBUILDER_RECEIVE_RULES';


/*
 * Action Creators
 */

export function filterBuilderStartEdit(makeNew, filter, fields) {
    return {
        type: FBUILDER_START_EDIT,
        makeNew,
        filter,
        fields
    };
}

export function filterBuilderSaveEdit() {
    return {
        type: FBUILDER_SAVE_EDIT
    };
}

export function filterBuilderEndEdit() {
    return {
        type: FBUILDER_END_EDIT
    };
}

export function filterBuilderChangeAttr(attr) {
    return {
        type: FBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description
    };
}

export function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        const editingFilter = getState().filterBuilder.editingFilter.filter;
        const {auth: {sessionId}, ui: {languageId} } = getState();
        dispatch(filtersListServerCreateFilter(editingFilter, sessionId, languageId))
            .then( () => {
                dispatch(closeModal('filters'));
                dispatch(filterBuilderEndEdit());
            });
    };
}

export function filterBuilderUpdateFilter() {

    return (dispatch, getState) => {
        const state = getState();
        const editingFilter = state.filterBuilder.editingFilter;
        const originalFilter = state.filterBuilder.originalFilter;
        const isNotEdited = _.includes(['advanced', 'standard'], editingFilter.filter.type)
            || originalFilter.parsedFilter === editingFilter.parsedFilter;

        if (state.auth.isDemo || isNotEdited) {
            dispatch(filtersListSelectFilter(editingFilter.filter.id));
            dispatch(closeModal('filters'));
            dispatch(filterBuilderEndEdit());
        } else {
            const sessionId = state.auth.sessionId;
            const resultEditingFilter = editingFilter.filter;
            dispatch(filtersListServerUpdateFilter(resultEditingFilter, sessionId))
                .then( () => {
                    dispatch(closeModal('filters'));
                    dispatch(filterBuilderEndEdit());
                });
        }
    };
}

export function filterBuilderSaveAndSelectRules() {
    return (dispatch, getState) => {
        dispatch(filterBuilderSaveEdit());
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
        rules
    };
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
        const {auth: {sessionId}, fields} = getState();
        dispatch(filtersListServerDeleteFilter(filterId, sessionId))
            .then( ()=> {
                const state = getState();
                const selectedFilterId = state.filtersList.selectedFilterId;
                const newFilterId = (filterId == selectedFilterId) ? state.filtersList.filters[0].id : selectedFilterId;
                const newFilter = _.find(state.filtersList.filters, {id: newFilterId});
                dispatch(filterBuilderStartEdit(false, newFilter, fields));
            });
    };
}
