import _ from 'lodash';

import * as ActionTypes from '../actions/samplesList';
import immutableArray from '../utils/immutableArray';
import {ImmutableHash, ImmutableHashedArray} from '../utils/immutable';

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
    const {samples, hashedArray, editedSamplesHash} = state;//TODO remove samples
    const updatedSampleIndex = _.findIndex(samples, {id: updatedSampleId});//TODO remove
    const newSampleId = updatedSample.id;

    const newSamples = immutableArray.replace(samples, updatedSampleIndex, updatedSample);//TODO remove
    const newHashedArray = ImmutableHashedArray.replaceItemId(hashedArray, updatedSampleId, updatedSample);
    const newEditedSamplesHash = ImmutableHash.replaceAsNewKey(editedSamplesHash, updatedSampleId, newSampleId, updatedSample);

    return {
        ...state,
        samples: newSamples,//TODO remove
        hashedArray: newHashedArray,
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceReceiveSamplesList(state, action) {
    const {samples} = action;
    const sortedSamples = _.sortBy(samples, (sample) => sample.fileName.toLowerCase());

    return {
        ...state,
        samples: sortedSamples,//TODO remove
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

function reduceChangeSample(state, action) {
    const {hashedArray} = state;
    const {sampleId} = action;

    const sample = hashedArray.hash[sampleId];

    return {
        ...state,
        selectedSample: sample
    };
}

function reduceChangeSamples(state, action) {
    const {samples} = action;
    return {
        ...state,
        samples, //TODO remove
        hashedArray: ImmutableHashedArray.makeFromArray(samples)
    };
}


export default function samplesList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
    editedSamplesHash: ImmutableHash.makeFromObject({}),
    selectedSample: null // TODO selectedSampleId: null
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

        case ActionTypes.CHANGE_SAMPLE:
            return reduceChangeSample(state, action);

        case ActionTypes.CHANGE_SAMPLES:
            return reduceChangeSamples(state, action);

        default:
            return state;
    }
}