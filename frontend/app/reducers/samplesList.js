import _ from 'lodash';

import * as ActionTypes from '../actions/samplesList';
import immutableArray from '../utils/immutableArray';
import {ImmutableHash, ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

function reduceRequestSamples(state) {
    return state;
}

function reduceUpdateSampleValue(state, action) {
    const {valueFieldId, value, sampleId} = action;
    const {editedSamplesHash} = state;
    const newValue = {fieldId: valueFieldId, values: value};

    const editedSample = editedSamplesHash[sampleId];
    const sampleValues = editedSample.values;
    const valueIndex = _.findIndex(sampleValues, {fieldId: valueFieldId});

    const newSampleValues = immutableArray.replace(sampleValues, valueIndex, newValue);
    const newEditedSample = {...editedSample, values: newSampleValues};
    const newEditedSamplesHash = ImmutableHash.replace(editedSamplesHash, sampleId, newEditedSample);

    return {
        ...state,
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceReceiveUpdatedSample(state, action) {
    const {updatedSample, updatedSampleId} = action;
    const {hashedArray, editedSamplesHash} = state;
    const newSampleId = updatedSample.id;

    const newHashedArray = ImmutableHashedArray.replaceItemId(hashedArray, updatedSampleId, updatedSample);
    const newEditedSamplesHash = ImmutableHash.replaceAsNewKey(editedSamplesHash, updatedSampleId, newSampleId, updatedSample);

    return {
        ...state,
        hashedArray: newHashedArray,
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceReceiveSamplesList(state, action) {
    const {samples} = action;
    const sortedSamples = _.sortBy(samples, (sample) => sample.fileName.toLowerCase());

    return {
        ...state,
        hashedArray: ImmutableHashedArray.makeFromArray(sortedSamples),
        editedSamplesHash: ImmutableHash.makeFromObject(_.keyBy(samples, 'id'))
    };
}

function reduceResetSampleInList(state, action) {
    const {sampleId} = action;
    const {hashedArray, editedSamplesHash} = state;
    const sample = hashedArray.hash[sampleId];

    const editedSample = editedSamplesHash[sampleId];
    const sampleValues = sample.values;

    const newEditedSample = {...editedSample, values: sampleValues};
    const newEditedSamplesHash = ImmutableHash.replace(editedSamplesHash, sampleId, newEditedSample);

    return {
        ...state,
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceSampleOnSave(state, action) {
    return {
        ...state,
        onSaveActionSelectedSamplesIds: action.selectedSamplesIds,
        onSaveAction: action.onSaveAction,
        onSaveActionPropertyIndex: action.onSaveActionPropertyIndex,
        onSaveActionPropertyId: action.onSaveActionPropertyId
    };
}

function reduceSamplesListSetHistorySamples(state, action) {
    const {samples} = action;
    const {hashedArray} = state;
    const samplesArrayHistoryParted = _.partition(hashedArray.array, {type: entityType.HISTORY});
    const samplesArrayWOHistory = samplesArrayHistoryParted[0].length ? samplesArrayHistoryParted[1] : hashedArray.array;
    const samplesToSet = _.filter(samples, (sample) => !hashedArray.hash[sample.id] || hashedArray.hash[sample.id].type === entityType.HISTORY);
    if (samplesArrayWOHistory === hashedArray.array && !samplesToSet.length) {
        return state;
    }
    const samplesToSetHistored = _.map(samplesToSet, (sample) => ({
        ...sample,
        type: entityType.HISTORY
    }));
    const samplesArrayWNewHistory = samplesToSetHistored.length ? [...samplesToSetHistored, ...samplesArrayWOHistory] : samplesArrayWOHistory;
    const samplesHashedArrayWNewHistory = ImmutableHashedArray.makeFromArray(samplesArrayWNewHistory);
    return {
        ...state,
        hashedArray: samplesHashedArrayWNewHistory
    };
}

function reduceSetCurrentSampleId(state, action) {
    return {
        ...state,
        currentSampleId: action.sampleId
    };
}

function reduceDisableSampleEdit(state, action) {
    const {sampleId, disable} = action;
    const {editingSample} = state;
    if (sampleId === editingSample.id) {
        return {
            ...state,
            editingSampleDisabled: disable
        };
    } else {
        return state;
    }
}

function addSamples(state, action) {
    const {samples} = action;
    const {hashedArray: {array: currentSamples}} = state;
    const newSampleList = currentSamples.concat(samples);
    const sortedSamples = _.sortBy(newSampleList, (sample) => sample.fileName.toLowerCase());
    return {
        ...state,
        hashedArray: ImmutableHashedArray.makeFromArray(sortedSamples),
        editedSamplesHash: ImmutableHash.makeFromObject(_.keyBy(samples, 'id'))
    };
}

function reduceSetEditingSampleId(state, action) {
    const {sampleId} = action;
    const {hashedArray: {hash: samplesHash}} = state;
    return {
        ...state,
        editingSample: sampleId && samplesHash[sampleId] || null,
        editingSampleDisabled: false
    };
}

export default function samplesList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
    editedSamplesHash: ImmutableHash.makeFromObject({}),
    editingSample: null,
    editingSampleDisabled: false,
    currentSampleId: null
}, action) {

    switch (action.type) {
        case ActionTypes.REQUEST_SAMPLES:
            return reduceRequestSamples(state);

        case ActionTypes.UPDATE_SAMPLE_VALUE:
            return reduceUpdateSampleValue(state, action);

        case ActionTypes.RECEIVE_UPDATED_SAMPLE:
            return reduceReceiveUpdatedSample(state, action);

        case ActionTypes.RECEIVE_SAMPLES_LIST:
            return reduceReceiveSamplesList(state, action);

        case ActionTypes.RESET_SAMPLE_IN_LIST:
            return reduceResetSampleInList(state, action);

        case ActionTypes.SAMPLE_ON_SAVE:
            return reduceSampleOnSave(state, action);

        case ActionTypes.SAMPLES_LIST_SET_HISTORY_SAMPLES:
            return reduceSamplesListSetHistorySamples(state, action);

        case ActionTypes.SET_CURRENT_SAMPLE_ID:
            return reduceSetCurrentSampleId(state, action);

        case ActionTypes.DISABLE_SAMPLE_EDIT:
            return reduceDisableSampleEdit(state, action);

        case ActionTypes.SAMPLES_LIST_ADD_SAMPLES:
            return addSamples(state, action);

        case ActionTypes.SET_EDITING_SAMPLE_ID:
            return reduceSetEditingSampleId(state, action);

        default:
            return state;
    }
}