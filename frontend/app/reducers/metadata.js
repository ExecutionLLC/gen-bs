import _ from 'lodash';

import * as ActionTypes from '../actions/metadata';
import {ImmutableHashedArray} from '../utils/immutable';
import FieldUtils from '../utils/fieldUtils';

const initialState = {
    editableMetadata: [],
    allMetadata: []
};

function reduceReceiveMetadata(action, state) {
    const allMetadata = FieldUtils.sortAndAddLabels(action.fields);
    const editableMetadata = _.filter(allMetadata, ['isEditable', true]);
    return Object.assign({}, state, {
        allMetadata: ImmutableHashedArray.makeFromArray(allMetadata),
        editableMetadata
    });
}

export default function fields(state = initialState, action) {

    switch (action.type) {

        case ActionTypes.RECEIVE_METADATA:
            return reduceReceiveMetadata(action, state);

        default:
            return state;
    }
}
