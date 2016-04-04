import * as ActionTypes from '../actions/ui'


export default function samplesList(state = {
    Samples: [],
    savedSamples: [],
}, action) {

    let currentSampleIndex;
    let newSamples;

    switch (action.type) {
        case ActionTypes.UPDATE_SAMPLE_VALUE:
            currentSampleIndex = _.findIndex(state.Samples, {id: action.sampleId});

            let newFields = state.Samples[currentSampleIndex].fields || {};
            newFields[action.valueFieldId] = action.value;

            newSamples = state.Samples;
            newSamples[currentSampleIndex].fields = newFields;

            return Object.assign({}, state, {Samples: newSamples});

        case ActionTypes.REQUEST_UPDATE_SAMPLE_FIELDS:

            return state;

        case ActionTypes.INIT_SAMPLES_LIST:
            return Object.assign({}, state, {
                Samples: action.samples,
                savedSamples: action.samples
            });

        case ActionTypes.RESET_SAMPLES_LIST:
            currentSampleIndex = _.findIndex(state.Samples, {id: action.sampleId});
            let restoredFields = state.savedSamples[currentSampleIndex].fields || {};

            newSamples = state.Samples;
            newSamples[currentSampleIndex].fields = newFields;

            return Object.assign({}, state, {Samples: newSamples});

        default:
            return state;
    }
}