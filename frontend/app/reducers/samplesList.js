import _ from 'lodash';

import * as ActionTypes from '../actions/samplesList';
import immutableArray from '../utils/immutableArray';

function reduceRequestSamples(state) {
    return state;
}

function reduceUpdateSampleValue(state, action) {
    const {valueFieldId, value, sampleId} = action;
    const {editedSamples} = state;

    const newValue = {fieldId: valueFieldId, values: value};

    const sampleIndex = _.findIndex(editedSamples, {id: sampleId});
    const editedSample = editedSamples[sampleIndex];
    const sampleValues = editedSample.values;
    const valueIndex = _.findIndex(sampleValues, {fieldId: valueFieldId});

    const newSampleValues = immutableArray.replace(sampleValues, valueIndex, newValue);
    const newEditedSamples = immutableArray.replace(editedSamples, sampleIndex, {...editedSample, values: newSampleValues});

    return {
        ...state,
        editedSamples: newEditedSamples
    };
}

function reduceReceiveUpdatedSample(state, action) {
    const {updatedSample, updatedSampleId} = action;
    const currentSampleIndex = _.findIndex(state.samples, {id: updatedSampleId});

    const newSamples = [...state.samples];
    const newEditedSamples = [...state.editedSamples];

    newSamples[currentSampleIndex] = updatedSample;
    newEditedSamples[currentSampleIndex] = Object.assign({}, updatedSample);

    return Object.assign({}, state, {samples: newSamples, editedSamples: newEditedSamples});
}

function reduceReceiveSamplesList(state, action) {
    const {samples} = action;
    const sortedSamples = _.sortBy(samples, sample => sample.fileName.toLowerCase());
    return Object.assign({}, state, {
        samples: [...sortedSamples],
        editedSamples: _.cloneDeep(sortedSamples)
    });
}

function reduceResetSampleInList(state, action) {
    let sampleId = action.sampleId;
    const currentSampleIndex = _.findIndex(state.editedSamples, {id: sampleId});
    const restoredValues = [...state.samples[currentSampleIndex].values || []];

    const newEditedSamples = [...state.editedSamples];
    newEditedSamples[currentSampleIndex].values = restoredValues;

    return Object.assign({}, state, {editedSamples: newEditedSamples});
}

function reduceChangeSample(state, action) {
    let {sampleId} = action;
    return Object.assign({}, state, {
        selectedSample: _.find(state.samples, {id: sampleId})
    });
}

function reduceChangeSamples(state, action) {
    const {samples} = action;
    return Object.assign({}, state, {
        samples: samples
    });
}


export default function samplesList(state = {
    samples: [],
    editedSamples: [],
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