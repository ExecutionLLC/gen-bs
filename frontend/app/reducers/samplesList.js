import _ from 'lodash';

import * as ActionTypes from '../actions/samplesList';
import immutableArray from '../utils/immutableArray';
import {ImmutableHash} from '../utils/immutable';

function reduceRequestSamples(state) {
    return state;
}

function reduceUpdateSampleValue(state, action) {
    const {valueFieldId, value, sampleId} = action;
    const {editedSamples, editedSamplesHash} = state;// rid of editedSamples
    const newValue = {fieldId: valueFieldId, values: value};

    const sampleIndex = _.findIndex(editedSamples, {id: sampleId});//rid of
    const editedSample = editedSamplesHash[sampleId];
    const sampleValues = editedSample.values;
    const valueIndex = _.findIndex(sampleValues, {fieldId: valueFieldId});

    const newSampleValues = immutableArray.replace(sampleValues, valueIndex, newValue);
    const newEditedSample = {...editedSample, values: newSampleValues};
    const newEditedSamples = immutableArray.replace(editedSamples, sampleIndex, newEditedSample);//rid of
    const newEditedSamplesHash = ImmutableHash.replace(editedSamplesHash, sampleId, newEditedSample);

    return {
        ...state,
        editedSamples: newEditedSamples,//rid of
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceReceiveUpdatedSample(state, action) {
    const {updatedSample, updatedSampleId} = action;
    const {samples, editedSamples, editedSamplesHash} = state;//rid of editedSamples
    const updatedSampleIndex = _.findIndex(samples, {id: updatedSampleId});
    const newSampleId = updatedSample.id;

    const newSamples = immutableArray.replace(samples, updatedSampleIndex, updatedSample);
    const newEditedSamples = immutableArray.replace(editedSamples, updatedSampleIndex, updatedSample);//rid of
    const newEditedSamplesHash = ImmutableHash.replaceAsNewKey(editedSamplesHash, updatedSampleId, newSampleId, updatedSample);

    return {
        ...state,
        samples: newSamples,
        editedSamples: newEditedSamples,//rid of
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceReceiveSamplesList(state, action) {
    const {samples} = action;
    const sortedSamples = _.sortBy(samples, (sample) => sample.fileName.toLowerCase());
    return {
        ...state,
        samples: sortedSamples,
        editedSamples: sortedSamples,//rid of
        editedSamplesHash: ImmutableHash.makeFromObject(_.keyBy(samples, 'id'))
    };
}

function reduceResetSampleInList(state, action) {
    const {sampleId} = action;
    const {samples, editedSamples, editedSamplesHash} = state;//rid of editedSamples
    const sampleIndex = _.findIndex(samples, {id: sampleId});//rid of
    const sample = _.find(samples, {id: sampleId});

    const editedSample = editedSamplesHash[sampleId];
    const sampleValues = sample.values;

    const newEditedSample = {...editedSample, values: sampleValues};
    const newEditedSamples = immutableArray.replace(editedSamples, sampleIndex, newEditedSample);//rid of
    const newEditedSamplesHash = ImmutableHash.replace(editedSamplesHash, sampleId, newEditedSample);

    return {
        ...state,
        editedSamples: newEditedSamples,//rid of
        editedSamplesHash: newEditedSamplesHash
    };
}

function reduceChangeSample(state, action) {
    const {samples} = state;
    const {sampleId} = action;

    const sample = _.find(samples, {id: sampleId});

    return {
        ...state,
        selectedSample: sample
    };
}

function reduceChangeSamples(state, action) {
    const {samples} = action;
    return {
        ...state,
        samples
    };
}


export default function samplesList(state = {
    samples: [],
    editedSamples: [],
    editedSamplesHash: ImmutableHash.makeFromObject({}),
    selectedSample: null
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