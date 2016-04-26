import * as ActionTypes from '../actions/fields'

// Patch field label because it may not exist
function updateFieldLabelIfNeeded(field) {
    return Object.assign({}, field, {
        label: field.label ? field.label : field.name
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
    const fields = action.fields.map(updateFieldLabelIfNeeded);
    const editableFields = _.filter(fields, 'isEditable', true);
    const notEditableSampleFields = _.filter(fields, 'isEditable', false);
    const idToFieldHash = _.reduce(fields, (result, field) => {
        result[field.id] = field;
        return result;
    }, {});

    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            samples: false
        }),
        sampleFieldsList: fields,
        editableFields,
        notEditableFields: notEditableSampleFields,
        idToFieldHash,
        lastUpdated: action.receivedAt
    });
}

function reduceReceiveTotalFields(action, state) {
    let totalFields = action.fields.map(updateFieldLabelIfNeeded);
    let sourceFields = _.filter(totalFields, (field) => field.sourceName !== 'sample');
    return Object.assign({}, state, {
        isFetching: Object.assign({}, state.isFetching, {
            sources: false
        }),
        totalFieldsList: totalFields,
        totalFieldsHash: _.reduce(totalFields, (result, field) => {
            result[field.id] = field;
            return result;
        }, {}),
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

export default function fields(state = {
    isFetching: {samples: false, sources: false},
    sampleFieldsList: [],
    sourceFieldsList: [],
    totalFieldsList:[],
    notEditableFields:[]
}, action) {

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
