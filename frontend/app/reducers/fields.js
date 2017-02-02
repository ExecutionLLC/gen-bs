import _ from 'lodash';

import * as ActionTypes from '../actions/fields';
import {ImmutableHashedArray} from '../utils/immutable';
import FieldUtils from '../utils/fieldUtils';

const initialState = {
    isFetching: {
        samples: false,
        sources: false
    },
    sourceFieldsList: [],
    totalFieldsHashedArray: ImmutableHashedArray.makeFromArray([])
};

function reduceReceiveTotalFields(action, state) {
    const totalFields = action.fields;
    const sourceFields = _.filter(totalFields, (field) => FieldUtils.isSourceField(field));
    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            sources: false
        }),
        totalFieldsHashedArray: ImmutableHashedArray.makeFromArray(totalFields),
        sourceFieldsList: sourceFields,
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
