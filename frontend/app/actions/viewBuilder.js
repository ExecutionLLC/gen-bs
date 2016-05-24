import apiFacade from '../api/ApiFacade';
import {closeModal} from './modalWindows';
import {fetchViews} from './userData';

import HttpStatus from 'http-status';
import {changeView} from './ui';
import {handleError} from './errorHandler';
import {deleteView} from './userData';

export const VBUILDER_START_EDIT = 'VBUILDER_START_EDIT';
export const VBUILDER_SAVE_EDIT = 'VBUILDER_SAVE_EDIT';
export const VBUILDER_END_EDIT = 'VBUILDER_END_EDIT';

export const VBUILDER_CHANGE_ATTR = 'VBUILDER_CHANGE_ATTR';

export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN';
export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN';
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN';
export const VBUILDER_CHANGE_SORT_COLUMN = 'VBUILDER_CHANGE_SORT_COLUMN';
export const VBUILDER_SET_ITEM_KEYWORDS = 'VBUILDER_SET_ITEM_KEYWORDS';

export const VBUILDER_REQUEST_UPDATE_VIEW = 'VBUILDER_REQUEST_UPDATE_VIEW';
export const VBUILDER_RECEIVE_UPDATE_VIEW = 'VBUILDER_RECEIVE_UPDATE_VIEW';

export const VBUILDER_REQUEST_CREATE_VIEW = 'VBUILDER_REQUEST_CREATE_VIEW';
export const VBUILDER_RECEIVE_CREATE_VIEW = 'VBUILDER_RECEIVE_CREATE_VIEW';

export const VBUILDER_REQUEST_DELETE_VIEW = 'VBUILDER_REQUEST_DELETE_VIEW';
export const VBUILDER_RECEIVE_DELETE_VIEW = 'VBUILDER_RECEIVE_DELETE_VIEW';

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

function viewBuilderReceiveUpdateView(json) {
    return {
        type: VBUILDER_RECEIVE_UPDATE_VIEW,
        view: json
    };
}

function viewBuilderUpdateView() {

    return (dispatch, getState) => {
        const state = getState();
        const editingView = state.viewBuilder.editingView;
        const isNotEdited = _.includes(['advanced', 'standard'], editingView.type)
            || state.viewBuilder.originalView === editingView;
        dispatch(viewBuilderRequestUpdateView());
        if (state.auth.isDemo || isNotEdited) {
            dispatch(closeModal('views'));
            dispatch(changeView(editingView.id));
        } else {
            const sessionId = state.auth.sessionId;

            dispatch(viewBuilderRequestUpdateView());
            viewsClient.update(sessionId, editingView, (error, response) => {
                if (error) {
                    dispatch(handleError(null, UPDATE_VIEW_NETWORK_ERROR));
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_VIEW_SERVER_ERROR));
                } else {
                    const result = response.body;
                    dispatch(viewBuilderReceiveUpdateView(result));
                    dispatch(closeModal('views'));
                    dispatch(fetchViews(result.id));
                }
            });
        }
    };
}

function viewBuilderCreateView() {

    return (dispatch, getState) => {
        dispatch(viewBuilderRequestCreateView());

        const {auth: {sessionId}, viewBuilder: {editingView}, ui: {languageId}} = getState();
        viewsClient.add(sessionId, languageId, editingView, (error, response) => {
            if (error) {
                dispatch(handleError(null, CREATE_VIEW_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, CREATE_VIEW_SERVER_ERROR));
            } else {
                const result = response.body;
                dispatch(viewBuilderReceiveCreateView(result));
                dispatch(closeModal('views'));
                dispatch(fetchViews(result.id));
            }
        });
    };
}

export function viewBuilderSaveAndSelectView() {
    return (dispatch, getState) => {
        dispatch(viewBuilderSaveEdit());
        const viewBuilder = getState().viewBuilder;
        const editingView = viewBuilder.editingView;
        if (editingView.id !== null) {
            dispatch(viewBuilderUpdateView());
        } else {
            dispatch(viewBuilderCreateView());
        }
    };
}

function viewBuilderRequestCreateView() {
    return {
        type: VBUILDER_REQUEST_CREATE_VIEW
    };
}

function viewBuilderReceiveCreateView(json) {
    return {
        type: VBUILDER_RECEIVE_CREATE_VIEW,
        view: json
    };
}

export function viewBuilderDeleteView(viewId) {
    return (dispatch, getState) => {
        dispatch(viewBuilderRequestDeleteView(viewId));
        const {auth: {sessionId}} = getState();
        viewsClient.remove(sessionId, viewId, (error, response) => {
            if (error) {
                dispatch(handleError(null, DELETE_VIEW_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, DELETE_VIEW_SERVER_ERROR));
            } else {
                const result = response.body;
                dispatch(viewBuilderReceiveDeleteView(result));
                dispatch(deleteView(result.id));
                const state = getState();
                const editingViewId = state.viewBuilder.editingView.id;
                const newViewId = (result.id == editingViewId) ? state.userData.views[0].id : editingViewId; // TODO vl use viewsList
                dispatch(changeView(newViewId));
                const newView = _.find(state.userData.views, {id: newViewId}); // TODO vl use viewsList
                dispatch(viewBuilderStartEdit(false, newView));
            }
        });
    };
}

function viewBuilderRequestDeleteView(viewId) {
    return {
        type: VBUILDER_REQUEST_DELETE_VIEW,
        viewId
    };
}

function viewBuilderReceiveDeleteView(json) {
    return {
        type: VBUILDER_RECEIVE_DELETE_VIEW,
        view: json
    };
}