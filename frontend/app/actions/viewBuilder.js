import apiFacade from '../api/ApiFacade';
import {closeModal} from './modalWindows';
import {fetchViews} from './userData';

import HttpStatus from 'http-status';
import {handleError} from './errorHandler';
import {deleteView} from './userData';
import {viewsListSelectView} from './viewsList';
import {viewsListServerCreateView} from './viewsList';
import {viewsListServerDeleteView} from './viewsList';
import {viewsListServerUpdateView} from './viewsList';

export const VBUILDER_START_EDIT = 'VBUILDER_START_EDIT';
export const VBUILDER_SAVE_EDIT = 'VBUILDER_SAVE_EDIT';
export const VBUILDER_END_EDIT = 'VBUILDER_END_EDIT';

export const VBUILDER_CHANGE_ATTR = 'VBUILDER_CHANGE_ATTR';

export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN';
export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN';
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN';
export const VBUILDER_CHANGE_SORT_COLUMN = 'VBUILDER_CHANGE_SORT_COLUMN';
export const VBUILDER_SET_ITEM_KEYWORDS = 'VBUILDER_SET_ITEM_KEYWORDS';

const CREATE_VIEW_NETWORK_ERROR = 'Cannot create new view (network error). Please try again.';
const CREATE_VIEW_SERVER_ERROR = 'Cannot create new view (server error). Please try again.';

const UPDATE_VIEW_NETWORK_ERROR = 'Cannot update view (network error). Please try again.';
const UPDATE_VIEW_SERVER_ERROR = 'Cannot update view (server error). Please try again.';

const DELETE_VIEW_NETWORK_ERROR = 'Cannot delete view (network error). Please try again.';
const DELETE_VIEW_SERVER_ERROR = 'Cannot delete view (server error). Please try again.';

const viewsClient = apiFacade.viewsClient;

/*
 * Action Creators
 */
export function viewBuilderStartEdit(makeNew, view) {
    return {
        type: VBUILDER_START_EDIT,
        makeNew,
        view
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

function viewBuilderRequestUpdateView() {
    return {
        type: VBUILDER_REQUEST_UPDATE_VIEW
    };
}

function viewBuilderCreateView() {

    return (dispatch, getState) => {
        const editingView = getState().viewBuilder.editingView;
        const {auth: {sessionId}, ui: {languageId} } = getState();
        dispatch(viewsListServerCreateView(editingView, sessionId, languageId))
            .then(() => {
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
        const isNotEdited = _.includes(['advanced', 'standard'], editingView.type)
            || originalView === editingView;

        if (state.auth.isDemo || isNotEdited) {
            dispatch(viewsListSelectView(editingView.id));
            dispatch(closeModal('views'));
            dispatch(viewBuilderEndEdit());
        } else {
            const sessionId = state.auth.sessionId;
            dispatch(viewsListServerUpdateView(editingView, sessionId))
                .then(() => {
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
        const editingView = viewBuilder.editingView;
        if (!viewBuilder.editingViewIsNew) {
            dispatch(viewBuilderUpdateView());
        } else {
            dispatch(viewBuilderCreateView());
        }
    };
}

export function viewBuilderDeleteView(viewId) {
    return (dispatch, getState) => {
        const {auth: {sessionId}} = getState();
        dispatch(viewsListServerDeleteView(viewId, sessionId))
            .then(() => {
                const state = getState();
                const views = state.viewsList.views;
                const editingViewId = state.viewBuilder.editingView.id;
                const newViewId = (viewId == editingViewId) ? views[0].id : editingViewId;
                const newView = _.find(views, {id: newViewId});
                dispatch(viewBuilderStartEdit(false, newView));
            });
    };
}
