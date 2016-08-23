import _ from 'lodash';

import * as ActionTypes from '../actions/fields';
import {ImmutableHashedArray} from '../utils/immutable';

const initialState = {
    isFetching: {
        samples: false,
        sources: false
    },
    sampleFieldsHashedArray: ImmutableHashedArray.makeFromArray([]),
    editableFields: [],
    sourceFieldsList: [],
    totalFieldsHashedArray: ImmutableHashedArray.makeFromArray([]),
    // Fields allowed for selection in a typical fields list (include current sample fields and sources fields)
    allowedFieldsList: []
};

// Patch field label because it may not exist
function updateFieldLabelIfNeeded(field) {
    return Object.assign({}, field, {
        label: field.label ? field.label : field.name
    });
}

function sortAndAddLabels(fields) {
    return fields.map(updateFieldLabelIfNeeded)
        .sort((a, b) => {
            if (a.label > b.label) {return 1;}
            if (a.label < b.label) {return -1;}
            return 0;
        });
}

function reduceRequestFields(action, state) {
    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            samples: true
        })
    });
}

function reduceReceiveFields(action, state) {
    const {sourceFieldsList} = state;
    const fields = sortAndAddLabels(action.fields);
    const editableFields = _.filter(fields, ['isEditable', true]);
    const allowedFieldsList = [
        ..._.filter(fields, ['isEditable', false]),
        ...sourceFieldsList
    ];

    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            samples: false
        }),
        sampleFieldsHashedArray: ImmutableHashedArray.makeFromArray(fields),
        editableFields,
        allowedFieldsList,
        lastUpdated: action.receivedAt
    });
}

function reduceReceiveTotalFields(action, state) {
    const totalFields = sortAndAddLabels(action.fields);
    const sourceFields = _.filter(totalFields, (field) => field.sourceName !== 'sample');
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

        case ActionTypes.REQUEST_FIELDS:
            return reduceRequestFields(action, state);

        case ActionTypes.RECEIVE_FIELDS:
            return reduceReceiveFields(action, state);

        case ActionTypes.REQUEST_TOTAL_FIELDS:
            return reduceRequestTotalFields(action, state);

        case ActionTypes.RECEIVE_TOTAL_FIELDS:
            return reduceReceiveTotalFields(action, state);

        default:
            return state;
    }
}
