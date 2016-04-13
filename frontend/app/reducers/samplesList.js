import * as ActionTypes from '../actions/samplesList'


export default function samplesList(state = {
    samples: [],
    editedSamples: [],
    currentSample: null
}, action) {

    let currentSampleIndex;
    let newSamples;
    let newEditedSamples;
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
            newEditedSamples = [...state.editedSamples];

            newSamples[currentSampleIndex] = updatedSample;
            newEditedSamples[currentSampleIndex] = Object.assign({}, updatedSample);

            return Object.assign({}, state, {samples: newSamples, editedSamples: newEditedSamples});

        case ActionTypes.RECEIVE_SAMPLES_LIST:
            const {samples} = action;
            return Object.assign({}, state, {
                samples: [...samples],
                editedSamples: _.cloneDeep(samples)
            });

        case ActionTypes.RESET_SAMPLE_IN_LIST:
            sampleId = action.sampleId;
            currentSampleIndex = _.findIndex(state.samples, {id: sampleId});
            const restoredValues = [...state.editedSamples[currentSampleIndex].values || []];

            newSamples = [...state.samples];
            newSamples[currentSampleIndex].values = restoredValues;

            return Object.assign({}, state, {samples: newSamples});

        case ActionTypes.CHANGE_SAMPLE:
            let {sampleId} = action;
            return Object.assign({}, state, {
                currentSample: _.find(state.samples, {id: sampleId})
            });

        default:
            return state;
    }
}