import * as ActionTypes from '../actions/samplesList'


export default function samplesList(state = {
    samples: [],
    savedSamples: [],
    currentSample: null
}, action) {

    let currentSampleIndex;
    let newSamples;
    let newSavedSamples;
    let newValues;
    let sampleId;

    switch (action.type) {
        case ActionTypes.REQUEST_SAMPLES:
            return Object.assign({}, state, {
                isFetching: true
            });
        
        case ActionTypes.UPDATE_SAMPLE_VALUE:
            const {valueFieldId, value} = action;
            sampleId = action.sampleId;
            currentSampleIndex = _.findIndex(state.samples, {id: sampleId});

            newValues = [...state.samples[currentSampleIndex].values || []];
            const valueIndex = _.findIndex(newValues, item => item.fieldId === valueFieldId);
            const newValue = {fieldId: valueFieldId, values: value};

            if (valueIndex >= 0) {
                newValues[valueIndex] = newValue;
            } else {
                newValues.push(newValue);
            }

            newSamples = [...state.samples];
            newSamples[currentSampleIndex].values = newValues;

            return Object.assign({}, state, {samples: newSamples});

        case ActionTypes.RECEIVE_UPDATED_SAMPLE:
            const {updatedSample, updatedSampleId} = action;
            currentSampleIndex = _.findIndex(state.samples, {id: updatedSampleId});

            newSamples = [...state.samples];
            newSavedSamples = [...state.savedSamples];

            newSamples[currentSampleIndex] = updatedSample;
            newSavedSamples[currentSampleIndex] = Object.assign({}, updatedSample);

            return Object.assign({}, state, {samples: newSamples, savedSamples: newSavedSamples});

        case ActionTypes.RECEIVE_SAMPLES_LIST:
            const {samples} = action;
            return Object.assign({}, state, {
                samples: [...samples],
                savedSamples: _.cloneDeep(samples)
            });

        case ActionTypes.RESET_SAMPLE_IN_LIST:
            sampleId = action.sampleId;
            currentSampleIndex = _.findIndex(state.samples, {id: sampleId});
            const restoredValues = [...state.savedSamples[currentSampleIndex].values || []];

            newSamples = [...state.samples];
            newSamples[currentSampleIndex].values = restoredValues;

            return Object.assign({}, state, {samples: newSamples});

        case ActionTypes.CHANGE_SAMPLE:
            const {sampleId} = action;
            return Object.assign({}, state, {
                currentSample: _.find(state.samples, {id: sampleId})
            });

        default:
            return state;
    }
}