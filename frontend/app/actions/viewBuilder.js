import apiFacade from '../api/ApiFacade';
import {closeModal} from './modalWindows';
import {fetchViews} from './userData';

import HttpStatus from 'http-status';
import {changeView} from "./ui";

export const VBUILDER_SELECT_VIEW = 'VBUILDER_SELECT_VIEW';

export const VBUILDER_CHANGE_ATTR = 'VBUILDER_CHANGE_ATTR';

export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN';
export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN';
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN';

export const VBUILDER_REQUEST_UPDATE_VIEW = 'VBUILDER_REQUEST_UPDATE_VIEW';
export const VBUILDER_RECEIVE_UPDATE_VIEW = 'VBUILDER_RECEIVE_UPDATE_VIEW';

export const VBUILDER_REQUEST_CREATE_VIEW = 'VBUILDER_REQUEST_CREATE_VIEW';
export const VBUILDER_RECEIVE_CREATE_VIEW = 'VBUILDER_RECEIVE_CREATE_VIEW';

export const VBUILDER_REQUEST_DELETE_VIEW = 'VBUILDER_REQUEST_DELETE_VIEW';
export const VBUILDER_RECEIVE_DELETE_VIEW = 'VBUILDER_RECEIVE_DELETE_VIEW';

export const VBUILDER_TOGGLE_NEW = 'VBUILDER_TOGGLE_NEW';
export const VBUILDER_TOGGLE_EDIT = ' VBUILDER_TOGGLE_EDIT';

const CREATE_VIEW_NETWORK_ERROR = 'Cannot create new view (network error). Please try again.';
const CREATE_VIEW_SERVER_ERROR = 'Cannot create new view (server error). Please try again.';

const UPDATE_VIEW_NETWORK_ERROR = 'Cannot update view (network error). Please try again.';
const UPDATE_VIEW_SERVER_ERROR = 'Cannot update view (server error). Please try again.';

const viewsClient = apiFacade.viewsClient;

/*
 * Action Creators
 */
export function viewBuilderToggleNew() {
    return {
        type: VBUILDER_TOGGLE_NEW
    };
}

export function viewBuilderSelectView(views, viewId, editOrNew) {
    return {
        type: VBUILDER_SELECT_VIEW,
        views,
        viewId,
        editOrNew
    };
}

export function viewBuilderToggleEdit(views, viewId) {
    return {
        type: VBUILDER_TOGGLE_EDIT,
        views,
        viewId
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

export function viewBuilderAddColumn(viewItemIndex) {
    return {
        type: VBUILDER_ADD_COLUMN,
        viewItemIndex
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

// FIXME: viewItemIndex is unused
export function viewBuilderUpdateView(viewItemIndex) {

    return (dispatch, getState) => {
        const state = getState();
        const editedView = state.viewBuilder.editedView;
        const isNotEditableView = _.includes(['advanced', 'standard'], editedView.type);

        dispatch(viewBuilderRequestUpdateView());
        if (state.auth.isDemo || isNotEditableView) {
            dispatch(closeModal('views'));
            dispatch(changeView(editedView.id));
        } else {
            const sessionId = state.auth.sessionId;

            dispatch(viewBuilderRequestUpdateView());
            viewsClient.update(sessionId, editedView, (error, response) => {
                if (error) {
                    dispatch(handleError(null, UPDATE_VIEW_NETWORK_ERROR));
                } else if (response.statusCode) {
                    dispatch(handleError(null, UPDATE_VIEW_SERVER_ERROR));
                } else {
                    const result = response.body;
                    dispatch(viewBuilderReceiveUpdateView(result));
                    dispatch(closeModal('views'));
                    dispatch(fetchViews(result.id))
                }
            });
        }
    }
}

// FIXME: viewItemIndex is unused
export function viewBuilderCreateView(viewItemIndex) {

    return (dispatch, getState) => {
        dispatch(viewBuilderRequestCreateView());

        const {auth: {sessionId}, viewBuilder: {editedView}, ui: {languageId}} = getState();
        viewsClient.add(sessionId, languageId, editedView, (error, response) => {
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
    }
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


function viewBuilderRequestDeleteView() {
    return {
        type: VBUILDER_REQUEST_DELETE_VIEW
    };
}

function viewBuilderReceiveDeleteView(json) {
    return {
        type: VBUILDER_RECEIVE_DELETE_VIEW,
        view: json
    }
}
