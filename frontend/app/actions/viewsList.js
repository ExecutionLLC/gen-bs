import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import HttpStatus from 'http-status';


const viewsClient = apiFacade.viewsClient;


export const VIEWS_LIST_START_SERVER_OPERATION = 'VIEWS_LIST_START_SERVER_OPERATION';
export const VIEWS_LIST_END_SERVER_OPERATION = 'VIEWS_LIST_END_SERVER_OPERATION';
export const VIEWS_LIST_RECEIVE = 'VIEWS_LIST_RECEIVE';
export const VIEWS_LIST_SELECT_VIEW = 'VIEWS_LIST_SELECT_VIEW';
export const VIEWS_LIST_ADD_VIEW = 'VIEWS_LIST_ADD_VIEW';
export const VIEWS_LIST_DELETE_VIEW = 'VIEWS_LIST_DELETE_VIEW';
export const VIEWS_LIST_EDIT_VIEW = 'VIEWS_LIST_EDIT_VIEW';

const CREATE_VIEW_NETWORK_ERROR = 'Cannot create new view (network error). Please try again.';
const CREATE_VIEW_SERVER_ERROR = 'Cannot create new view (server error). Please try again.';

const UPDATE_VIEW_NETWORK_ERROR = 'Cannot update view (network error). Please try again.';
const UPDATE_VIEW_SERVER_ERROR = 'Cannot update view (server error). Please try again.';

const DELETE_VIEW_NETWORK_ERROR = 'Cannot delete view (network error). Please try again.';
const DELETE_VIEW_SERVER_ERROR = 'Cannot delete view (server error). Please try again.';


export function viewsListStartServerOperation() {
    return {
        type: VIEWS_LIST_START_SERVER_OPERATION
    };
}

export function viewsListEndServerOperation() {
    return {
        type: VIEWS_LIST_END_SERVER_OPERATION
    };
}

export function viewsListReceive(views) {
    return {
        type: VIEWS_LIST_RECEIVE,
        views
    };
}

export function viewsListSelectView(viewId) {
    return {
        type: VIEWS_LIST_SELECT_VIEW,
        viewId
    };
}

export function viewsListAddView(view) {
    return {
        type: VIEWS_LIST_ADD_VIEW,
        view
    };
}

export function viewsListDeleteView(viewId) {
    return {
        type: VIEWS_LIST_DELETE_VIEW,
        viewId
    };
}

export function viewsListEditView(viewId, view) {
    return {
        type: VIEWS_LIST_EDIT_VIEW,
        viewId,
        view
    };
}

export function viewsListServerCreateView(view, sessionId, languageId) {
    return (dispatch) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.add(sessionId, languageId, view, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, CREATE_VIEW_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, CREATE_VIEW_SERVER_ERROR));
                    reject();
                } else {
                    const newView = response.body;
                    const viewId = newView.id;
                    dispatch(viewsListAddView(newView));
                    dispatch(viewsListSelectView(viewId));
                    resolve(newView);
                }
            });
        });
    };
}

export function viewsListServerUpdateView(view, sessionId) {
    return (dispatch) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.update(sessionId, view, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, UPDATE_VIEW_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_VIEW_SERVER_ERROR));
                    reject();
                } else {
                    const updatedView = response.body;
                    dispatch(viewsListEditView(view.id, updatedView));
                    dispatch(viewsListSelectView(updatedView.id));
                    resolve();
                }
            });
        });
    };
}

export function viewsListServerDeleteView(viewId, sessionId) {
    return (dispatch) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.remove(sessionId, viewId, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, DELETE_VIEW_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, DELETE_VIEW_SERVER_ERROR));
                    reject();
                } else {
                    dispatch(viewsListDeleteView(viewId));
                    resolve();
                }
            });
        });
    };
}
