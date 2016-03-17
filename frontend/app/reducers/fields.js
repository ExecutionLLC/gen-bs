import * as ActionTypes from '../actions/fields'

export default function fields(state = {
    isFetching: {samples: false, sources: false},
    list: [],
    sourceFieldsList: []
}, action) {

    switch (action.type) {

        case ActionTypes.REQUEST_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: true
                })
            });

        case ActionTypes.RECEIVE_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: false
                }),
                list: action.fields,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_SOURCE_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    sources: true
                })
            });

        case ActionTypes.RECEIVE_SOURCE_FIELDS:
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
