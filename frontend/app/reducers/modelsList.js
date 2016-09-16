import * as _ from 'lodash';
import * as ActionTypes from '../actions/modelsList';
import {ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

function reduceModelListDeleteModel(state, action) {
    const newHashedArray = ImmutableHashedArray.deleteItemId(state.hashedArray, action.modelId);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceModelListEditModel(state, action) {
    const newHashedArray = ImmutableHashedArray.replaceItemId(state.hashedArray, action.modelId, action.model);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceModelListAddModel(state, action) {
    return Object.assign({}, state, {
        hashedArray: ImmutableHashedArray.appendItem(state.hashedArray, action.model)
    });
}

function reduceModelListReceive(state, action) {
    const newHashedArray = ImmutableHashedArray.makeFromArray(action.models);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceModelListSetHistoryModel(state, action) {
    const {model} = action;
    const {hashedArray} = state;
    const inListModel = model && hashedArray.hash[model.id];
    const isModelInListWOHistory = inListModel && inListModel.type !== entityType.HISTORY;
    const isNeedToSet = model && !isModelInListWOHistory;
    const modelsArrayHistoryParted = _.partition(hashedArray.array, {type: entityType.HISTORY});
    const modelsArrayWOHistory = modelsArrayHistoryParted[0].length ? modelsArrayHistoryParted[1] : hashedArray.array;
    if (modelsArrayWOHistory === hashedArray.array && !isNeedToSet) {
        return state;
    }
    const modelToSet = isNeedToSet && {
        ...model,
        type: entityType.HISTORY
    };
    const modelsArrayWNewHistory = isNeedToSet ? [modelToSet, ...modelsArrayWOHistory] : modelsArrayWOHistory;
    const modelsHashedArrayWNewHistory = ImmutableHashedArray.makeFromArray(modelsArrayWNewHistory);
    return {
        ...state,
        hashedArray: modelsHashedArrayWNewHistory
    };
}


export default function modelsList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
    isServerOperation: false
}, action) {

    switch (action.type) {
        case ActionTypes.MODELS_LIST_START_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: true
            });
        case ActionTypes.MODELS_LIST_END_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: false
            });
        case ActionTypes.MODELS_LIST_RECEIVE:
            return reduceModelListReceive(state, action);
        case ActionTypes.MODELS_LIST_ADD_MODEL:
            return reduceModelListAddModel(state, action);
        case ActionTypes.MODELS_LIST_DELETE_MODEL:
            return reduceModelListDeleteModel(state, action);
        case ActionTypes.MODELS_LIST_EDIT_MODEL:
            return reduceModelListEditModel(state, action);
        case ActionTypes.MODELS_LIST_SET_HISTORY_MODEL:
            return reduceModelListSetHistoryModel(state, action);
        default:
            return state;
    }
}
