import {closeModal, modalName} from './modalWindows';
import {
    filtersListServerCreateFilterAsync,
    filtersListServerUpdateFilterAsync,
    filtersListServerDeleteFilterAsync
} from './filtersList';
import {
    modelsListServerCreateModel,
    modelsListServerUpdateModel,
    modelsListServerDeleteModel
} from './modelsList';
import {entityTypeIsEditable} from '../utils/entityTypes';
import {immutableSetPathProperty} from '../utils/immutable';


export const filterBuilderStrategyName = {
    FILTER: 'filter',
    MODEL: 'model'
};

// Model builder and filter builder slightly differs.
// We cannot pass callback through the store,
// so we pass strategy name ('filter' or 'model') and get actions from this object.
export const filterBuilderStrategyActions = {
    [filterBuilderStrategyName.FILTER]: {
        getList(state) {
            return state.filtersList;
        },
        serverCreate: filtersListServerCreateFilterAsync,
        serverUpdate: filtersListServerUpdateFilterAsync,
        serverDelete: filtersListServerDeleteFilterAsync
    },
    [filterBuilderStrategyName.MODEL]: {
        getList(state) {
            return state.modelsList;
        },
        serverCreate: modelsListServerCreateModel,
        serverUpdate: modelsListServerUpdateModel,
        serverDelete: modelsListServerDeleteModel
    }
};


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

export function filterBuilderStartEdit(makeNew, filter, fields, allowedFields, filtersStrategy, filtersList, languageId) {
    return {
        type: FBUILDER_START_EDIT,
        makeNew,
        filter,
        filtersStrategy,
        filtersList,
        fields,
        allowedFields,
        languageId
    };
}

export function filterBuilderRestartEdit(makeNew, filter, languageId) {
    return (dispatch, getState) => {
        const state = getState();
        const {filterBuilder: {allowedFields, filtersStrategy}, fields} = state;
        const strategyActions = filterBuilderStrategyActions[filtersStrategy.name];
        dispatch(filterBuilderStartEdit(makeNew, filter, fields, allowedFields, filtersStrategy, strategyActions.getList(state), languageId));
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

export function filterBuilderChangeAttr(attr, languageId) {
    return {
        type: FBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description,
        languageId
    };
}

export function fireOnSaveAction(filter) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionProperty} = getState().filterBuilder;
        dispatch(immutableSetPathProperty(onSaveAction, onSaveActionProperty, filter.id));
    };
}

function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        const {filterBuilder: {editingFilter: {filter: editingFilter}, filtersStrategy}, ui: {languageId}} = getState();
        dispatch(filterBuilderStrategyActions[filtersStrategy.name].serverCreate(editingFilter, languageId))
            .then( (filter) => {
                dispatch(fireOnSaveAction(filter));
                dispatch(closeModal(modalName.FILTERS));
                dispatch(filterBuilderEndEdit());
            });
    };
}

function filterBuilderUpdateFilter() {

    return (dispatch, getState) => {
        const {filterBuilder: {editingFilter, originalFilter, filtersStrategy}} = getState();
        const isNotEdited = !entityTypeIsEditable(editingFilter.filter.type)
            || originalFilter.parsedFilter === editingFilter.parsedFilter;

        if (isNotEdited) {
            dispatch(fireOnSaveAction(editingFilter.filter));
            dispatch(closeModal(modalName.FILTERS));
            dispatch(filterBuilderEndEdit());
        } else {
            const resultEditingFilter = editingFilter.filter;
            dispatch(filterBuilderStrategyActions[filtersStrategy.name].serverUpdate(resultEditingFilter))
                .then( (filter) => {
                    dispatch(fireOnSaveAction(filter));
                    dispatch(closeModal(modalName.FILTERS));
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

export function filterBuilderDeleteFilter(filterId, languageId) {
    return (dispatch, getState) => {
        return new Promise((resolve) => {
            const {filterBuilder} = getState();
            dispatch(filterBuilderStrategyActions[filterBuilder.filtersStrategy.name].serverDelete(filterId))
                .then(() => {
                    const {filterBuilder} = getState();
                    const editingFilterId = filterBuilder.editingFilter.filter.id;
                    const {hashedArray} = filterBuilder.filtersList;
                    const newFilterId = (filterId == editingFilterId) ? hashedArray.array[0].id : editingFilterId;
                    const newFilter = hashedArray.hash[newFilterId];
                    dispatch(filterBuilderRestartEdit(false, newFilter, languageId));
                    resolve(newFilter);
                });
        });
    };
}
