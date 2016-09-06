import {closeModal} from './modalWindows';
import {
    viewsListServerCreateView,
    viewsListServerDeleteView,
    viewsListServerUpdateView
} from './viewsList';
import {entityTypeIsEditable} from '../utils/entityTypes';
import {immutableSetPathProperty} from '../utils/immutable';


export const VBUILDER_ON_SAVE = 'VBUILDER_ON_SAVE';
export const VBUILDER_START_EDIT = 'VBUILDER_START_EDIT';
export const VBUILDER_SAVE_EDIT = 'VBUILDER_SAVE_EDIT';
export const VBUILDER_END_EDIT = 'VBUILDER_END_EDIT';

export const VBUILDER_CHANGE_ATTR = 'VBUILDER_CHANGE_ATTR';

export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN';
export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN';
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN';
export const VBUILDER_CHANGE_SORT_COLUMN = 'VBUILDER_CHANGE_SORT_COLUMN';
export const VBUILDER_SET_ITEM_KEYWORDS = 'VBUILDER_SET_ITEM_KEYWORDS';


/*
 * Action Creators
 */
export function viewBuilderOnSave(onSaveAction, onSaveActionProperty) {
    return {
        type: VBUILDER_ON_SAVE,
        onSaveAction,
        onSaveActionProperty
    };
}

export function viewBuilderStartEdit(makeNew, view, allowedFields) {
    return {
        type: VBUILDER_START_EDIT,
        makeNew,
        view,
        allowedFields
    };
}

export function viewBuilderRestartEdit(makeNew, view) {
    return (dispatch, getState) => {
        dispatch(viewBuilderStartEdit(makeNew, view, getState().viewBuilder.allowedFields));
    };
}

export function viewBuilderSaveEdit() {
    return {
        type: VBUILDER_SAVE_EDIT
    };
}

export function viewBuilderEndEdit() {
    return {
        type: VBUILDER_END_EDIT
    };
}

export function viewBuilderChangeAttr(attr) {
    return {
        type: VBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description
    };
}

export function viewBuilderChangeColumn(viewItemIndex, fieldId) {
    return {
        type: VBUILDER_CHANGE_COLUMN,
        viewItemIndex,
        fieldId
    };
}

export function viewBuilderDeleteColumn(viewItemIndex) {
    return {
        type: VBUILDER_DELETE_COLUMN,
        viewItemIndex
    };
}

export function viewBuilderAddColumn(viewItemIndex, columnFieldId) {
    return {
        type: VBUILDER_ADD_COLUMN,
        viewItemIndex,
        columnFieldId
    };
}

export function viewBuilderChangeSortColumn(fieldId, sortDirection, ctrlKeyPressed) {
    return {
        type: VBUILDER_CHANGE_SORT_COLUMN,
        fieldId,
        sortDirection,
        sortOrder: ctrlKeyPressed ? 2 : 1
    };
}

export function viewBuilderChangeKeywords(viewItemIndex, keywordsIds) {
    return {
        type: VBUILDER_SET_ITEM_KEYWORDS,
        viewItemIndex,
        keywordsIds
    };
}

function fireOnSaveAction(view) {
    return (dispatch, getState) => {
        const {onSaveAction, onSaveActionProperty} = getState().viewBuilder;
        dispatch(immutableSetPathProperty(onSaveAction, onSaveActionProperty, view.id));
    };
}

function viewBuilderCreateView() {

    return (dispatch, getState) => {
        const editingView = getState().viewBuilder.editingView;
        const {ui: {languageId} } = getState();
        dispatch(viewsListServerCreateView(editingView, languageId))
            .then((view) => {
                dispatch(fireOnSaveAction(view));
                dispatch(closeModal('views'));
                dispatch(viewBuilderEndEdit());
            });
    };
}

function viewBuilderUpdateView() {

    return (dispatch, getState) => {
        const state = getState();
        const editingView = state.viewBuilder.editingView;
        const originalView = state.viewBuilder.originalView;
        const isNotEdited = !entityTypeIsEditable(editingView.type)
            || originalView === editingView;

        if (state.auth.isDemo || isNotEdited) {
            dispatch(fireOnSaveAction(editingView));
            dispatch(closeModal('views'));
            dispatch(viewBuilderEndEdit());
        } else {
            dispatch(viewsListServerUpdateView(editingView))
                .then((view) => {
                    dispatch(fireOnSaveAction(view));
                    dispatch(closeModal('views'));
                    dispatch(viewBuilderEndEdit());
                });
        }
    };
}

export function viewBuilderSaveAndSelectView() {
    return (dispatch, getState) => {
        dispatch(viewBuilderSaveEdit());
        const viewBuilder = getState().viewBuilder;
        if (!viewBuilder.editingViewIsNew) {
            dispatch(viewBuilderUpdateView());
        } else {
            dispatch(viewBuilderCreateView());
        }
    };
}

export function viewBuilderDeleteView(viewId) {
    return (dispatch, getState) => {
        dispatch(viewsListServerDeleteView(viewId))
            .then(() => {
                const state = getState();
                const views = state.viewsList.hashedArray.array;
                const viewIdToViewHash = state.viewsList.hashedArray.hash;
                const editingViewId = state.viewBuilder.editingView.id;
                const newViewId = (viewId == editingViewId) ? views[0].id : editingViewId;
                const newView = viewIdToViewHash[newViewId];
                dispatch(viewBuilderRestartEdit(false, newView));
            });
    };
}
