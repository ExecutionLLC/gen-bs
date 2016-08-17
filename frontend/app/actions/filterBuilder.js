import {closeModal} from './modalWindows';
import {
    filtersListServerCreateFilter,
    filtersListServerUpdateFilter,
    filtersListServerDeleteFilter
} from './filtersList';
import {entityTypeIsEditable} from '../utils/entityTypes';
import {immutableSetPathProperty} from '../utils/immutable';


export const FBUILDER_ON_SAVE = 'FBUILDER_ON_SAVE';
export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR';
export const FBUILDER_CHANGE_FILTER = 'FBUILDER_CHANGE_FILTER';

export const FBUILDER_START_EDIT = 'FBUILDER_START_EDIT';
export const FBUILDER_SAVE_EDIT = 'FBUILDER_SAVE_EDIT';
export const FBUILDER_END_EDIT = 'FBUILDER_END_EDIT';


/*
 * Action Creators
 */
export function filterBuilderOnSave(onSaveAction, onSaveActionProperty) {
    return {
        type: FBUILDER_ON_SAVE,
        onSaveAction,
        onSaveActionProperty
    };
}

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

function fireOnSaveAction(filter) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionProperty} = getState().filterBuilder;
        dispatch(immutableSetPathProperty(onSaveAction, onSaveActionProperty, filter.id));
    };
}

function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        const editingFilter = getState().filterBuilder.editingFilter.filter;
        const {ui: {languageId} } = getState();
        dispatch(filtersListServerCreateFilter(editingFilter, languageId))
            .then( (filter) => {
                dispatch(fireOnSaveAction(filter));
                dispatch(closeModal('filters'));
                dispatch(filterBuilderEndEdit());
            });
    };
}

function filterBuilderUpdateFilter() {

    return (dispatch, getState) => {
        const state = getState();
        const editingFilter = state.filterBuilder.editingFilter;
        const originalFilter = state.filterBuilder.originalFilter;
        const isNotEdited = !entityTypeIsEditable(editingFilter.filter.type)
            || originalFilter.parsedFilter === editingFilter.parsedFilter;

        if (state.auth.isDemo || isNotEdited) {
            dispatch(fireOnSaveAction(editingFilter.filter));
            dispatch(closeModal('filters'));
            dispatch(filterBuilderEndEdit());
        } else {
            const resultEditingFilter = editingFilter.filter;
            dispatch(filtersListServerUpdateFilter(resultEditingFilter))
                .then( (filter) => {
                    dispatch(fireOnSaveAction(filter));
                    dispatch(closeModal('filters'));
                    dispatch(filterBuilderEndEdit());
                });
        }
    };
}

export function filterBuilderSaveAndSelectRules() {
    return (dispatch, getState) => {
        dispatch(filterBuilderSaveEdit());
        if (!getState().filterBuilder.editingFilter.isNew) {
            dispatch(filterBuilderUpdateFilter());
        } else {
            dispatch(filterBuilderCreateFilter());
        }
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
        const {fields} = getState();
        dispatch(filtersListServerDeleteFilter(filterId))
            .then( ()=> {
                const state = getState();
                const editingFilterId = state.filterBuilder.editingFilter.filter.id;
                const newFilterId = (filterId == editingFilterId) ? state.filtersList.hashedArray.array[0].id : editingFilterId;
                const newFilter = state.filtersList.hashedArray.hash[newFilterId];
                dispatch(filterBuilderStartEdit(false, newFilter, fields));
            });
    };
}
