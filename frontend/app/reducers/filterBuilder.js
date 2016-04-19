import * as ActionTypes from '../actions/filterBuilder'
import {filterUtils, genomicsParsedRulesValidate, fieldUtils} from '../utils/filterUtils';
import FieldUtils from "../utils/fieldUtils";

export default function filterBuilder(state = {
    isReceivedFilters: false,
    selectedFilter: null,
    isFetching: false,
    rulesRequested: false,
    editingFilter: {
        filter: null,
        rulesParsed: null,
        isNew: false
    }
}, action) {

    var selectedFilter;
    var filterToEdit;

    switch (action.type) {
        case ActionTypes.FBUILDER_SELECT_FILTER:
            selectedFilter = _.find(action.filters, {id: action.filterId}) || null;
            return Object.assign({}, state, {
                selectedFilter,
                isReceivedFilters: selectedFilter !== null
            });

        case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
            filterToEdit = action.makeNew ?
                Object.assign({}, state.selectedFilter, {
                    type: 'user',
                    name: `Copy of ${state.selectedFilter.name}`
                }) :
                state.selectedFilter;
            console.log('FBUILDER_TOGGLE_NEW_EDIT', action.fields, filterToEdit);
            const fields = FieldUtils.makeFieldsList(action.fields);
            const fieldDefaultId = fieldUtils.getDefaultId(fields);
            const parsedRawRules = filterUtils.getRulesFromGenomics(filterToEdit.rules);
            const validateRulesResult = genomicsParsedRulesValidate.validateGemonicsParsedRules(fields, parsedRawRules);
            // Report validation results if any
            if (validateRulesResult.report.length) {
                console.error('Filter rules are invalid:');
                console.error(JSON.stringify(parsedRawRules, null, 4));
                console.error('Filter validation report:');
                console.error(JSON.stringify(validateRulesResult.report, null, 4));
            }
            const parsedRules = validateRulesResult.validRules ||
                {condition : 'AND', rules: [{field: fieldDefaultId, operator: 'is_null'}]};
            return Object.assign({}, state, {
                editingFilter: {
                    filter: filterToEdit,
                    isNew: action.makeNew,
                    parsedFilter: parsedRules
                }
            });

        case ActionTypes.FBUILDER_CHANGE_ATTR:
            return Object.assign({}, state, {
                editingFilter: state.editingFilter ?
                    Object.assign({}, state.editingFilter, {
                        filter: Object.assign({}, state.editingFilter.filter,
                            {
                                name: action.name,
                                description: action.description
                            }
                        )
                    }) :
                    null
            });

        case ActionTypes.FBUILDER_RECEIVE_RULES:
            return Object.assign({}, state, {
                rulesRequested: false,
                rulesPrepared: true,
                editingFilter: state.editingFilter ?
                    Object.assign({}, state.editingFilter, {
                        filter: Object.assign({}, state.editingFilter.filter,
                            {
                                rules: action.rules
                            })
                    }) :
                    null
            });

        case ActionTypes.FBUILDER_REQUEST_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false,
                selectedFilter: action.filter
            });

        case ActionTypes.FBUILDER_REQUEST_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false,
                selectedFilter: action.filter
            });

        case ActionTypes.FBUILDER_CHANGE_ALL: return (function() {
            return Object.assign({}, state, {
                editingFilter: Object.assign({}, state.editingFilter, {
                    filter: Object.assign({}, state.editingFilter.filter, {
                        rules: action.rules
                    })
                })
            });
        })();

        default:
            return state
    }
}
