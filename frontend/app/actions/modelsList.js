import HttpStatus from 'http-status';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';

const modelsClient = apiFacade.modelsClient;

export const MODELS_LIST_START_SERVER_OPERATION = 'MODELS_LIST_START_SERVER_OPERATION';
export const MODELS_LIST_END_SERVER_OPERATION = 'MODELS_LIST_END_SERVER_OPERATION';
export const MODELS_LIST_RECEIVE = 'MODELS_LIST_RECEIVE';
export const MODELS_LIST_ADD_MODEL = 'MODELS_LIST_ADD_MODEL';
export const MODELS_LIST_DELETE_MODEL = 'MODELS_LIST_DELETE_MODEL';
export const MODELS_LIST_EDIT_MODEL = 'MODELS_LIST_EDIT_MODEL';
export const MODELS_LIST_SET_HISTORY_MODEL = 'MODELS_LIST_SET_HISTORY_MODEL';


const CREATE_MODEL_NETWORK_ERROR = 'Cannot create new model (network error). Please try again.';
const CREATE_MODEL_SERVER_ERROR = 'Cannot create new model (server error). Please try again.';

const UPDATE_MODEL_NETWORK_ERROR = 'Cannot update model (network error). Please try again.';
const UPDATE_MODEL_SERVER_ERROR = 'Cannot update model (server error). Please try again.';

const DELETE_MODEL_NETWORK_ERROR = 'Cannot delete model(network error). Please try again.';
const DELETE_MODEL_SERVER_ERROR = 'Cannot delete model (server error). Please try again.';


export function modelsListStartServerOperation() {
    return {
        type: MODELS_LIST_START_SERVER_OPERATION
    };
}

export function modelsListEndServerOperation() {
    return {
        type: MODELS_LIST_END_SERVER_OPERATION
    };
}

export function modelsListReceive(models) {
    return {
        type: MODELS_LIST_RECEIVE,
        models
    };
}

export function modelsListAddModel(model) {
    return {
        type: MODELS_LIST_ADD_MODEL,
        model
    };
}

export function modelsListDeleteModel(modelId) {
    return {
        type: MODELS_LIST_DELETE_MODEL,
        modelId
    };
}

export function modelsListEditModel(modelId, model) {
    return {
        type: MODELS_LIST_EDIT_MODEL,
        modelId,
        model
    };
}

export function modelsListServerCreateModel(model, languageId) {
    return (dispatch) => {
        dispatch(modelsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            modelsClient.add(languageId, model, (error, response) => {
                dispatch(modelsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, CREATE_MODEL_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, CREATE_MODEL_SERVER_ERROR));
                    reject();
                } else {
                    const newModel = response.body;
                    dispatch(modelsListAddModel(newModel));
                    resolve(newModel);
                }
            });
        });
    };
}

export function modelsListServerUpdateModel(model) {
    return (dispatch) => {
        dispatch(modelsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            modelsClient.update(model, (error, response) => {
                dispatch(modelsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, UPDATE_MODEL_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, UPDATE_MODEL_SERVER_ERROR));
                    reject();
                } else {
                    const updatedModel = response.body;
                    dispatch(modelsListEditModel(model.id, updatedModel));
                    resolve(updatedModel);
                }
            });
        });
    };
}

export function modelsListServerDeleteModel(modelId) {
    return (dispatch) => {
        dispatch(modelsListStartServerOperation());
        return new Promise( (resolve, reject) => {
            modelsClient.remove(modelId, (error, response) => {
                dispatch(modelsListEndServerOperation());
                if (error) {
                    dispatch(handleError(null, DELETE_MODEL_NETWORK_ERROR));
                    reject();
                } else if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, DELETE_MODEL_SERVER_ERROR));
                    reject();
                } else {
                    dispatch(modelsListDeleteModel(modelId));
                    resolve();
                }
            });
        });
    };
}

export function modelsListSetHistoryModel(model) {
    return {
        type: MODELS_LIST_SET_HISTORY_MODEL,
        model
    };
}