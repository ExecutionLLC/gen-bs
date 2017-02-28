import {closeModal, modalName} from './modalWindows';
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

export function viewBuilderStartEdit(newViewInfo, view, allowedFields, languageId) {
    return {
        type: VBUILDER_START_EDIT,
        newViewInfo,
        view,
        allowedFields,
        languageId
    };
}

export function viewBuilderRestartEdit(newViewInfo, view, languageId) {
    return (dispatch, getState) => {
        dispatch(viewBuilderStartEdit(newViewInfo, view, getState().viewBuilder.allowedFields, languageId));
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

export function viewBuilderChangeAttr(attr, languageId) {
    return {
        type: VBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description,
        languageId
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
                dispatch(closeModal(modalName.VIEWS));
                dispatch(viewBuilderEndEdit());
            });
    };
}

function viewBuilderUpdateView() {

    return (dispatch, getState) => {
        const {viewBuilder: {editingView, originalView}} = getState();
        const isNotEdited = !entityTypeIsEditable(editingView.type)
            || originalView === editingView;

        if (isNotEdited) {
            dispatch(fireOnSaveAction(editingView));
            dispatch(closeModal(modalName.VIEWS));
            dispatch(viewBuilderEndEdit());
        } else {
            dispatch(viewsListServerUpdateView(editingView))
                .then((view) => {
                    dispatch(fireOnSaveAction(view));
                    dispatch(closeModal(modalName.VIEWS));
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

export function viewBuilderDeleteView(viewId, languageId) {
    return (dispatch, getState) => {
        return new Promise((resolve) => {
            dispatch(viewsListServerDeleteView(viewId))
                .then(() => {
                    const {
                        viewsList: {hashedArray: {array: views, hash: viewIdToViewHash}},
                        viewBuilder: {editingView: {id: editingViewId}}
                    } = getState();
                    const newViewId = (viewId == editingViewId) ? views[0].id : editingViewId;
                    const newView = viewIdToViewHash[newViewId];
                    dispatch(viewBuilderRestartEdit(null, newView, languageId));
                    dispatch(fireOnSaveAction(newView));
                    resolve(newView);
                });
        });
    };
}
