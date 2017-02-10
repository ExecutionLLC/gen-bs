import HttpStatus from 'http-status';
import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import {setCurrentAnalysesHistoryIdLoadDataAsync} from './analysesHistory';


const viewsClient = apiFacade.viewsClient;


export const VIEWS_LIST_START_SERVER_OPERATION = 'VIEWS_LIST_START_SERVER_OPERATION';
export const VIEWS_LIST_END_SERVER_OPERATION = 'VIEWS_LIST_END_SERVER_OPERATION';
export const VIEWS_LIST_RECEIVE = 'VIEWS_LIST_RECEIVE';
export const VIEWS_LIST_ADD_VIEW = 'VIEWS_LIST_ADD_VIEW';
export const VIEWS_LIST_DELETE_VIEW = 'VIEWS_LIST_DELETE_VIEW';
export const VIEWS_LIST_EDIT_VIEW = 'VIEWS_LIST_EDIT_VIEW';
export const VIEWS_LIST_SET_HISTORY_VIEW = 'VIEWS_LIST_SET_HISTORY_VIEW';


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

export function viewsListServerCreateView(view, languageId) {
    return (dispatch, getState) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.add(languageId, view, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.createViewNetworkError')));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.createViewServerError')));
                    reject();
                } else {
                    const newView = response.body;
                    dispatch(viewsListAddView(newView));
                    resolve(newView);
                }
            });
        });
    };
}

export function viewsListServerUpdateView(view) {
    return (dispatch, getState) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.update(view, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.updateViewNetworkError')));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.updateViewServerError')));
                    reject();
                } else {
                    const updatedView = response.body;
                    dispatch(viewsListEditView(view.id, updatedView));
                    const {analysesHistory: {currentHistoryId}} = getState();
                    return dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId))
                        .then(() => resolve(updatedView));
                }
            });
        });
    };
}

export function viewsListServerDeleteView(viewId) {
    return (dispatch, getState) => {
        dispatch(viewsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            viewsClient.remove(viewId, (error, response) => {
                dispatch(viewsListEndServerOperation());
                if (error) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.deleteViewNetworkError')));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    const p = getP(getState());
                    dispatch(handleError(null, p.t('view.errors.deleteViewServerError')));
                    reject();
                } else {
                    dispatch(viewsListDeleteView(viewId));
                    resolve();
                }
            });
        });
    };
}

export function viewsListSetHistoryView(view) {
    return {
        type: VIEWS_LIST_SET_HISTORY_VIEW,
        view
    };
}