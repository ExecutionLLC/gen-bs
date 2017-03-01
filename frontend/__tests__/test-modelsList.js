import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {modelsListServerCreateModel, modelsListServerUpdateModel, modelsListServerDeleteModel} from '../app/actions/modelsList';
import {runListedObjectTests} from './HashedArrayDataUtils';


const {modelsClient} = apiFacade;


function buildModelsState(appState) {
    const {
        auth,
        ui,
        modelsList: {hashedArray: {array: models}}
    } = appState;

    const initialAppState = {
        auth,
        ui,
        modelsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(models)
        }
    };

    return {
        initialAppState,
        models,
        createdModelId: 'createdm-odel-iden-tifi-er0000000000'
    };
}


runListedObjectTests({
    listName: 'Models list',
    buildInitState() {
        const {initialAppState, models, createdModelId} = buildModelsState(MOCK_APP_STATE);
        return {
            initialAppState,
            list: models,
            createdItemId: createdModelId
        };
    },
    makeActions: {
        remove(modelId, sessionId) {
            return (dispatch) => {
                dispatch(modelsListServerDeleteModel(modelId));
            };
        },
        update(newModel, sessionId) {
            return (dispatch) => {
                dispatch(modelsListServerUpdateModel(newModel));
            };
        },
        create(newModel, sessionId, languageId) {
            return (dispatch) => {
                return dispatch(modelsListServerCreateModel(newModel, languageId));
            }
        }
    },
    makeMocks: {
        remove(mustError) {
            modelsClient.remove = (modelId, callback) => {
                if (mustError) {
                    return callback({message: 'mockedError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {id: modelId}});
                }
            };
        },
        update(mustError) {
            modelsClient.update = (model, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: _.cloneDeep(model)});
                }
            };
        },
        create(mustError, newModelId) {
            modelsClient.add = (languageId, model, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {..._.cloneDeep(model), id: newModelId}});
                }
            };
        }
    },
    removeMocks: {
        remove() {
            delete modelsClient.remove;
        },
        update() {
            delete modelsClient.update;
        },
        create() {
            delete modelsClient.add;
        }
    },
    getStateHashedArray(globalState) {
        const {modelsList: {hashedArray: modelsHashedArray}} = globalState;
        return modelsHashedArray;
    }
});
