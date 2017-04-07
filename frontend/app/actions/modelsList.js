import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';
import {setCurrentAnalysesHistoryIdLoadDataAsync} from './analysesHistory';
import {getP} from 'redux-polyglot/dist/selectors';

const modelsClient = apiFacade.modelsClient;

export const MODELS_LIST_START_SERVER_OPERATION = 'MODELS_LIST_START_SERVER_OPERATION';
export const MODELS_LIST_END_SERVER_OPERATION = 'MODELS_LIST_END_SERVER_OPERATION';
export const MODELS_LIST_RECEIVE = 'MODELS_LIST_RECEIVE';
export const MODELS_LIST_ADD_MODEL = 'MODELS_LIST_ADD_MODEL';
export const MODELS_LIST_DELETE_MODEL = 'MODELS_LIST_DELETE_MODEL';
export const MODELS_LIST_EDIT_MODEL = 'MODELS_LIST_EDIT_MODEL';
export const MODELS_LIST_SET_HISTORY_MODEL = 'MODELS_LIST_SET_HISTORY_MODEL';


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
    return (dispatch, getState) => {
        dispatch(modelsListStartServerOperation());
        return new Promise(
            (resolve) => modelsClient.add(languageId, model, (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(modelsListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.createModelError'), error, response));
        }).then((response) => response.body
        ).then((newModel) => {
            dispatch(modelsListAddModel(newModel));
            return newModel;
        });
    };
}

export function modelsListServerUpdateModel(model) {
    return (dispatch, getState) => {
        dispatch(modelsListStartServerOperation());
        return new Promise(
            (resolve) => modelsClient.update(model, (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(modelsListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.updateModelError'), error, response));
        }).then((response) => response.body
        ).then((updatedModel) => {
            dispatch(modelsListEditModel(model.id, updatedModel));
            const {analysesHistory: {currentHistoryId}} = getState();
            return dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId))
                .then(() => updatedModel);
        });
    };
}

export function modelsListServerDeleteModel(modelId) {
    return (dispatch, getState) => {
        dispatch(modelsListStartServerOperation());
        return new Promise(
            (resolve) => modelsClient.remove(modelId, (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(modelsListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.deleteModelError'), error, response));
        }).then(() => dispatch(modelsListDeleteModel(modelId)));
    };
}

export function modelsListSetHistoryModel(model) {
    return {
        type: MODELS_LIST_SET_HISTORY_MODEL,
        model
    };
}