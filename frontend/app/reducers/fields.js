import * as ActionTypes from '../actions/fields'

// Patch field label because it may not exist
function updateFieldLabelIfNeeded(field) {
    return Object.assign({}, field, {
        label: field.label ? field.label : field.name
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
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: true
                })
            });

        case ActionTypes.RECEIVE_FIELDS:
            const fields = action.fields.map(updateFieldLabelIfNeeded);
            const editableFields = _.filter(fields, 'is_editable', true);
            const notEditableSampleFields = _.filter(fields, 'is_editable', false);
            const idToFieldHash = _.reduce(fields, (result, field) => {
                result[field.id] = field;
                return result;
            });
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    samples: false
                }),
                sampleFieldsList: fields,
                editableFields,
                notEditableFields:notEditableSampleFields,
                idToFieldHash,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_TOTAL_FIELDS:
            return Object.assign({}, state, {
                isFetching: Object.assign({}, state.isFetching, {
                    sources: true
                })
            });

        case ActionTypes.RECEIVE_TOTAL_FIELDS:
            let totalFields = action.fields.map(updateFieldLabelIfNeeded);
            let sourceFields = _.filter(totalFields, (field) => field.source_name !== 'sample');
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

        default:
            return state;
    }
}
