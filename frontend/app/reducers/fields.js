import * as ActionTypes from '../actions/fields';
import {ImmutableHashedArray} from '../utils/immutable';

const initialState = {
    isFetching: {
        samples: false,
        sources: false
    },
    totalFieldsHashedArray: ImmutableHashedArray.makeFromArray([])
};

function reduceReceiveTotalFields(action, state) {
    const totalFields = action.fields;
    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            sources: false
        }),
        totalFieldsHashedArray: ImmutableHashedArray.makeFromArray(totalFields),
        lastUpdated: action.receivedAt
    });
}

function reduceRequestTotalFields(action, state) {
    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            sources: true
        })
    });
}

export default function fields(state = initialState, action) {

    switch (action.type) {

        case ActionTypes.REQUEST_TOTAL_FIELDS:
            return reduceRequestTotalFields(action, state);

        case ActionTypes.RECEIVE_TOTAL_FIELDS:
            return reduceReceiveTotalFields(action, state);

        default:
            return state;
    }
}
