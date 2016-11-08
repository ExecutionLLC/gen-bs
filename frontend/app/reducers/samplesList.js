import _ from 'lodash';

import * as ActionTypes from '../actions/samplesList';
import immutableArray from '../utils/immutableArray';
import {ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

function reduceRequestSamples(state) {
    return state;
}

function reduceUpdateSampleValue(state, action) {
    const {valueFieldId, value, sampleId} = action;
    const {editingSample} = state;

    if (!editingSample || editingSample.id !== sampleId) {
        return state;
    }

    const newValue = {fieldId: valueFieldId, value: value};
    const sampleValues = editingSample.editableFields.fields;
    const valueIndex = _.findIndex(sampleValues, {fieldId: valueFieldId});

    const newSampleValues = immutableArray.replace(sampleValues, valueIndex, newValue);
    const newEditingSample = {...editingSample,
        editableFields: {
            ...editingSample.editableFields,
            fields: newSampleValues
        }
    };

    return {
        ...state,
        editingSample: newEditingSample
    };
}

function reduceReceiveUpdatedSample(state, action) {
    const {updatedSample, updatedSampleId} = action;
    const {hashedArray, editingSample} = state;

    const newHashedArray = ImmutableHashedArray.replaceItemId(hashedArray, updatedSampleId, updatedSample);

    const newEditingSample = editingSample && editingSample.id === updatedSampleId ?
        updatedSample :
        editingSample;

    return {
        ...state,
        hashedArray: newHashedArray,
        editingsample: newEditingSample
    };
}

function reduceReceiveSamplesList(state, action) {
    const {samples} = action;
    const sortedSamples = _.sortBy(samples, (sample) => sample.fileName.toLowerCase());

    return {
        ...state,
        hashedArray: ImmutableHashedArray.makeFromArray(sortedSamples),
        editingSample: null
    };
}

function reduceResetSampleInList(state, action) {
    const {sampleId} = action;
    const {hashedArray, editingSample} = state;

    if (!editingSample || editingSample.id !== sampleId) {
        return state;
    }

    const sample = hashedArray.hash[sampleId];
    const sampleValues = sample.editableFields;
    const newEditingSample = {...editingSample, editableFields: sampleValues};

    return {
        ...state,
        editingSample: newEditingSample
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
    if (!editingSample || editingSample.id !== sampleId) {
        return state;
    }
    return {
        ...state,
        editingSampleDisabled: disable
    };
}

function addSamples(state, action) {
    const {samples} = action;
    const {hashedArray: {array: currentSamples}} = state;
    const newSampleList = currentSamples.concat(samples);
    const sortedSamples = _.sortBy(newSampleList, (sample) => sample.fileName.toLowerCase());
    return {
        ...state,
        hashedArray: ImmutableHashedArray.makeFromArray(sortedSamples),
        editingSample: null
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

function updateSampleFields(state, action) {
    const {samples} = action;
    const {hashedArray: {array: currentSamples}} = state;
    const updatedSampleHash = _.keyBy(samples, 'genotypeId');
    const newSampleList = _.map(currentSamples, sample => {
        const updatedSample = updatedSampleHash[sample.genotypeId];
        if (updatedSample) {
            return {
                ...sample,
                sampleFields: updatedSample.sampleFields
            };
        } else {
            return sample;
        }
    });
    return {
        ...state,
        hashedArray: ImmutableHashedArray.makeFromArray(newSampleList),
        editingSample: null
    };
}

export default function samplesList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
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

        case ActionTypes.SAMPLES_LIST_UPDATE_SAMPLES_FIELDS:
            return updateSampleFields(state, action);

        default:
            return state;
    }
}