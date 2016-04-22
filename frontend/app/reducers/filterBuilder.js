import * as ActionTypes from '../actions/filterBuilder'
import {filterUtils, genomicsParsedRulesValidate, opsUtils} from '../utils/filterUtils';
import FieldUtils from "../utils/fieldUtils";


/**
 * @param {boolean} isNew
 * @param {{rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}} filterToEdit
 * @param {{id: string, label: string, type: string}[]} fields
 * @returns {{filter: {rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}, isNew: boolean, parsedFilter: {condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}, fieldDefaultId: string}}
 */
function makeFilterEditing(isNew, filterToEdit, fields) {
    const fieldDefaultId = FieldUtils.getDefaultId(fields);
    const parsedRawRules = filterUtils.getRulesFromGenomics(filterToEdit.rules);
    const validateRulesResult = genomicsParsedRulesValidate.validateGemonicsParsedRules(fields, parsedRawRules);
    // Report validation results if any
    if (!_.isEmpty(validateRulesResult.report)) {
        console.error('Filter rules are invalid:');
        console.error(JSON.stringify(parsedRawRules, null, 4));
        console.error('Filter validation report:');
        console.error(JSON.stringify(validateRulesResult.report, null, 4));
    }
    const parsedFilter = validateRulesResult.validRules || filterUtils.genomicsParsedRulesModification.makeDefaultGroup(fieldDefaultId);
    return {
        filter: filterToEdit,
        isNew,
        parsedFilter,
        fieldDefaultId
    };
}

function makeFilterChanged(parsedFilter, fieldDefaultId, index, change) {
    const modification = filterUtils.genomicsParsedRulesModification;
    const changeFunctions = {
        onSwitch(isAnd) {
            return modification.switchCondition(parsedFilter, index, isAnd)
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
            return modification.setRule(parsedFilter, index, ruleIndex, {field: item.field, operator: item.operator, value: castedValue});
        },
        onDelete(itemIndex) {
            return modification.removeRuleOrGroup(parsedFilter, index, itemIndex);
        },
        onAdd(isGroup) {
            return modification.appendDefault(parsedFilter, index, isGroup, fieldDefaultId)
        }
    };
    var changeName;
    for (changeName in change) {
        if (!change.hasOwnProperty(changeName)) {
            continue;
        }
        const changeFunction = changeFunctions[changeName];
        if (changeFunction) {
            return changeFunction(change[changeName]);
        }
    }
    return null;
}


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
    var newParsedRules;

    switch (action.type) {
        case ActionTypes.FBUILDER_SELECT_FILTER:
            selectedFilter = _.find(action.filters, {id: action.filterId}) || null;
            return Object.assign({}, state, {
                selectedFilter,
                isReceivedFilters: selectedFilter !== null
            });

        case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
            return Object.assign({}, state, {
                editingFilter: makeFilterEditing(
                    action.makeNew,
                    action.makeNew ?
                        Object.assign({}, state.selectedFilter, {
                            type: 'user',
                            name: `Copy of ${state.selectedFilter.name}`
                        }) :
                        state.selectedFilter,
                    FieldUtils.makeFieldsListForFiltersSelect(action.fields))
            });
        
        case ActionTypes.FBUILDER_CHANGE_FILTER:
            newParsedRules = makeFilterChanged(state.editingFilter.parsedFilter, state.editingFilter.fieldDefaultId, action.index, action.change);
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

        default:
            return state
    }
}
