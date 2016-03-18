import * as ActionTypes from '../actions/fields'

function updateFieldsSamples(field) {
    // patch field because some properties may not exists
    field.label = field.label !== undefined ? field.label : field.name;
    return field
}

export default function fields(state = {
    isFetching: {samples: false, sources: false},
    list: [],
    sourceFieldsList: []
}, action) {
    var sourceFields;

    switch (action.type) {

        case ActionTypes.REQUEST_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: true
                })
            });

        case ActionTypes.RECEIVE_FIELDS:
            sourceFields = action.fields.map(updateFieldsSamples);
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: false
                }),
                list: sourceFields,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_SOURCE_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    sources: true
                })
            });

        case ActionTypes.RECEIVE_SOURCE_FIELDS:
            sourceFields = action.sourceFields.map(updateFieldsSamples);
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    sources: false
                }),
                sourceFieldsList: action.sourceFields,
                lastUpdated: action.receivedAt
            });

        default:
            return state;
    }
}
