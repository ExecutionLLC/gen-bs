import * as ActionTypes from '../actions/filterBuilder'
import {filterUtils, genomicsParsedRulesValidate, opsUtils} from '../utils/filterUtils';
import FieldUtils from "../utils/fieldUtils";


/**
 * @param {boolean} isNew
 * @param {{rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}} filterToEdit
 * @param {{id: string, label: string, type: string}[]} fields
 * @returns {{filter: {rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}, isNew: boolean, parsedFilter: {condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}, fieldDefaultId: string}}
 */
function parseFilterForEditing(isNew, filterToEdit, fields) {
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

function applyFilterChange(parsedFilter, fieldDefaultId, index, change) {
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

function reduceFBuilderSelectFilter(state, action) {
    const selectedFilter = _.find(action.filters, {id: action.filterId}) || null;
    return Object.assign({}, state, {
        selectedFilter,
        isReceivedFilters: selectedFilter !== null
    });
}

function reduceFBuilderToggleNewEdit(state, action) {
    const editingFilter = parseFilterForEditing(
        action.makeNew,
        action.makeNew ?
            Object.assign({}, state.selectedFilter, {
                type: 'user',
                name: `Copy of ${state.selectedFilter.name}`
            }) :
            state.selectedFilter,
        action.fields.totalFieldsList.map((f) => FieldUtils.makeFieldSelectItemValue(f))
    );
    return Object.assign({}, state, {
        editingFilter,
        originalFilter: editingFilter
    });
}

function reduceFBuilderStartEdit(state, makeNew, filter, fields) {
    const editingFilter = parseFilterForEditing(
        makeNew,
        makeNew ?
            Object.assign({}, filter, {
                type: 'user',
                name: `Copy of ${filter.name}`
            }) :
            filter,
        fields.totalFieldsList.map((f) => FieldUtils.makeFieldSelectItemValue(f))
    );
    return Object.assign({}, state, {
        editingFilter: editingFilter,
        originalFilter: editingFilter
    });
}

function reduceFBuilderSaveEdit(state) {
    const parsedRules = state.editingFilter.parsedFilter;
    const rules = filterUtils.getGenomics(parsedRules);
    return Object.assign({}, state, {
        editingFilter: Object.assign({}, state.editingFilter, {
            filter: Object.assign({}, state.editingFilter.filter, {
                rules
            })
        })
    });
}
    
function reduceFBuilderEndEdit(state) {
    return Object.assign({} ,state, {
        editingFilter: null,
        originalFilter: null
    });
}

function reduceFBuilderChangeFilter(state, action) {
    const newParsedRules = applyFilterChange(state.editingFilter.parsedFilter, state.editingFilter.fieldDefaultId, action.index, action.change);
    if (!newParsedRules) {
        return Object.assign({}, state, {});
    } else {
        return Object.assign({}, state, {
            editingFilter: Object.assign({}, state.editingFilter, {
                parsedFilter: newParsedRules
            })
        });
    }
}

function reduceFBuilderChangeAttr(state, action) {
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
}

function reduceFBuilderReceiveRules(state, action) {
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
}


export default function filterBuilder(state = {
    isReceivedFilters: false,
    isFetching: false,
    rulesRequested: false,
    /** @type {?{filter: Object, parsedFilter: Object, isNew: boolean, filedDefaultId: string}} */
    editingFilter: null,
    originalFilter: null
}, action) {

    switch (action.type) {
        case ActionTypes.FBUILDER_SELECT_FILTER:
            return reduceFBuilderSelectFilter(state, action);

        case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
            return reduceFBuilderToggleNewEdit(state, action);
        
        case ActionTypes.FBUILDER_CHANGE_FILTER:
            return reduceFBuilderChangeFilter(state, action);

        case ActionTypes.FBUILDER_CHANGE_ATTR:
            return reduceFBuilderChangeAttr(state, action);

        case ActionTypes.FBUILDER_RECEIVE_RULES:
            return reduceFBuilderReceiveRules(state, action);

        case ActionTypes.FBUILDER_REQUEST_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false
            });

        case ActionTypes.FBUILDER_REQUEST_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false
            });

        case ActionTypes.FBUILDER_START_EDIT:
            return reduceFBuilderStartEdit(state, action.makeNew, action.filter, action.fields);

        case ActionTypes.FBUILDER_SAVE_EDIT:
            return reduceFBuilderSaveEdit(state);

        case ActionTypes.FBUILDER_END_EDIT:
            return reduceFBuilderEndEdit(state);

        default:
            return state
    }
}
