import * as ActionTypes from '../actions/filterBuilder'
import {filterUtils, genomicsParsedRulesValidate, opsUtils} from '../utils/filterUtils';
import FieldUtils from "../utils/fieldUtils";

export default function filterBuilder(state = {
    isReceivedFilters: false,
    selectedFilter: null,
    isFetching: false,
    rulesRequested: false,
    editingFilter: {
        filter: null,
        parsedFilter: null,
        isNew: false,
        fieldDefaultId: ''
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
            const fields = FieldUtils.makeFieldsList(action.fields);
            const fieldDefaultId = FieldUtils.getDefaultId(fields);
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
                    parsedFilter: parsedRules,
                    fieldDefaultId: fieldDefaultId
                }
            });
        
        case ActionTypes.FBUILDER_CHANGE_FILTER:
            console.log(action);
            const doFs = {
                onSwitch(isAnd) {
                    return filterUtils.genomicsParsedRulesModification.switchCondition(state.editingFilter.parsedFilter, action.index, isAnd)
                },
                onEdit(itemTyped) {
                    const ruleIndex = itemTyped.ruleIndex;
                    const item = itemTyped.item;
                    const fieldJSType = itemTyped.fieldJSType;
                    const itemOpType = item.operator;
                    const itemOp = filterUtils.getOperatorByType(itemOpType);
                    const opWant = opsUtils.getOperatorWantedParams(itemOp);
                    const value = item.value;
                    const castedValue = opWant.noParams ?
                        null :
                        opWant.single ?
                            (typeof value === 'object' && value && value.length) ? genomicsParsedRulesValidate.jsTypeCastValue(value.join(), fieldJSType) : genomicsParsedRulesValidate.jsTypeCastValue(value, fieldJSType) :
                            genomicsParsedRulesValidate.jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);
                    return filterUtils.genomicsParsedRulesModification.setRule(state.editingFilter.parsedFilter, action.index, ruleIndex, {field: item.field, operator: item.operator, value: castedValue});
                },
                onDelete(itemIndex) {
                    return filterUtils.genomicsParsedRulesModification.removeRuleOrGroup(state.editingFilter.parsedFilter, action.index, itemIndex);
                },
                onAdd(isGroup) {
                    return filterUtils.genomicsParsedRulesModification.appendDefault(state.editingFilter.parsedFilter, action.index, isGroup, state.editingFilter.fieldDefaultId)
                }
            };
            var newParsedRules;
            for (var fname in action.change) {
                if (!action.change.hasOwnProperty(fname)) {
                    continue;
                }
                var doF = doFs[fname];
                if (doF) {
                    newParsedRules = doF(action.change[fname]);
                    break;
                }
            }
            if (!newParsedRules) {
                return Object.assign({}, state, {});
            } else {
                return Object.assign({}, state, {
                    editingFilter: Object.assign({}, state.editingFilter, {
                        parsedFilter: newParsedRules
                    })
                });
            }

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
