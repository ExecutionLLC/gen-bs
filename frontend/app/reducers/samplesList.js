import * as ActionTypes from '../actions/samplesList'


export default function samplesList(state = {
    samples: [],
    savedSamples: [],
    currentSample: null,
}, action) {

    let currentSampleIndex;
    let newSamples;
    let newSavedSamples;
    let newValues;
    let sampleId;

    switch (action.type) {
        case ActionTypes.UPDATE_SAMPLE_VALUE:
            const {valueFieldId, value} = action;
            sampleId = action.sampleId;
            currentSampleIndex = _.findIndex(state.samples, {id: sampleId});

            newValues = [...state.samples[currentSampleIndex].values || []];
            const valueIndex = _.findIndex(newValues, item => item.fieldId === valueFieldId);
            const newValue = {fieldId: valueFieldId, values: value}

            if (valueIndex >= 0) {
                newValues[valueIndex] = newValue;
            } else {
                newValues.push(newValue);
            }

            newSamples = [...state.samples];
            newSamples[currentSampleIndex].values = newValues;

            return Object.assign({}, state, {samples: newSamples});

        case ActionTypes.UPDATE_SAMPLES_LIST:
            const {updatedSample} = action;
            currentSampleIndex = _.findIndex(state.samples, {id: action.sampleId});

            newSamples = [...state.samples];
            newSavedSamples = [...state.savedSamples];

            newSamples[currentSampleIndex] = updatedSample;
            newSavedSamples[currentSampleIndex] = Object.assign({}, updatedSample);

            return Object.assign({}, state, {samples: newSamples, savedSamples: newSavedSamples});

        case ActionTypes.INIT_SAMPLES_LIST:
            const {samples} = action;
            return Object.assign({}, state, {
                samples: [...samples],
                savedSamples: _.cloneDeep(samples),
            });

        case ActionTypes.RESET_SAMPLES_LIST:
            sampleId = action.sampleId;
            currentSampleIndex = _.findIndex(state.samples, {id: sampleId});
            const restoredValues = [...state.savedSamples[currentSampleIndex].values || []];

            newSamples = [...state.samples];
            newSamples[currentSampleIndex].values = restoredValues;

            return Object.assign({}, state, {samples: newSamples});

        case ActionTypes.CHANGE_SAMPLE:
            return Object.assign({}, state, {
                currentSample: _.find(state.samples, {id: action.sampleId})
            });

        default:
            return state;
    }
}