import _ from 'lodash';

import * as ActionTypes from '../actions/filterBuilder';
import {filterUtils, genomicsParsedRulesValidate, opsUtils, isFilterComplexModel} from '../utils/filterUtils';
import FieldUtils from '../utils/fieldUtils';
import {entityType} from '../utils/entityTypes';
import {ImmutableHashedArray} from '../utils/immutable';
import * as i18n from '../utils/i18n';


/**
 * @param {boolean} isNew
 * @param {{rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}} filterToEdit
 * @param {{id: string, label: string, type: string}[]} fields
 * @param {string} parentFilterId
 * @param {{id: string, label: string, type: string, sampleType: string=}[]} allowedFields
 * @returns {{filter: {rules: {$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }}, isNew: boolean, parsedFilter: {condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}, fieldDefaultId: string, sampleDefaultType: string=}}
 */
function parseFilterForEditing(isNew, filterToEdit, parentFilterId, fields, allowedFields) {
    const fieldDefaultId = FieldUtils.getDefaultId(allowedFields);
    const fieldDefault = _.find(allowedFields, {id: fieldDefaultId});
    const sampleDefaultType = fieldDefault.sampleType;
    /** @type {?{condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}} */
    const parsedRawRules = isFilterComplexModel(filterToEdit) ?
        null :
        filterUtils.getRulesFromGenomics(filterToEdit.rules);
    const validateRulesResult = parsedRawRules && genomicsParsedRulesValidate.validateGemonicsParsedRules(fields, parsedRawRules);
    // Report validation results if any
    if (validateRulesResult && !_.isEmpty(validateRulesResult.report)) {
        console.error('Filter rules are invalid:');
        console.error(JSON.stringify(parsedRawRules, null, 4));
        console.error('Filter validation report:');
        console.error(JSON.stringify(validateRulesResult.report, null, 4));
    }
    const parsedFilter = parsedRawRules ?
        validateRulesResult.validRules || filterUtils.genomicsParsedRulesModification.makeDefaultGroup(fieldDefaultId, sampleDefaultType) :
        null;
    return {
        filter: filterToEdit,
        isNew,
        parentFilterId,
        parsedFilter,
        fieldDefaultId,
        sampleDefaultType
    };
}

function applyFilterChange(parsedFilter, fieldDefaultId, sampleDefaultType, index, change) {
    const modification = filterUtils.genomicsParsedRulesModification;
    const changeFunctions = {
        onSwitch(isAnd) {
            return modification.switchCondition(parsedFilter, index, isAnd);
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
                    (_.isArray(value)) ? genomicsParsedRulesValidate.jsTypeCastValue(value[0], fieldJSType) : genomicsParsedRulesValidate.jsTypeCastValue(value, fieldJSType) :
                    genomicsParsedRulesValidate.jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);
            return modification.setRule(parsedFilter, index, ruleIndex, {field: item.field, sampleType: item.sampleType, operator: item.operator, value: castedValue});
        },
        onDelete(itemIndex) {
            return modification.removeRuleOrGroup(parsedFilter, index, itemIndex);
        },
        onAdd(isGroup) {
            return modification.appendDefault(parsedFilter, index, isGroup, fieldDefaultId, sampleDefaultType);
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

function reduceFBuilderStartEdit(state, action) {
    const {fields: {totalFieldsHashedArray: {array: totalFieldsList}}, allowedFields, filter, makeNew, filtersStrategy, filtersList} = action;
    const editingFilter = parseFilterForEditing(
        makeNew,
        makeNew ?
            i18n.changeEntityText(
                {
                    ...filter,
                    type: entityType.USER,
                    id: null
                },
                'en',
                {
                    name: i18n.makeCopyOfText(i18n.getEntityText(filter, 'en').name),
                }
            ) :
            filter,
        filter.id,
        totalFieldsList.map((f) => FieldUtils.makeFieldSelectItemValue(f)), // need for type convert from 'valueType' to 'type'
        allowedFields
    );
    const newFiltersList = {
        hashedArray: ImmutableHashedArray.makeFromArray(filtersList.hashedArray.array.filter((model) => model.analysisType === filtersStrategy.analysisType))
    };

    return Object.assign({}, state, {
        filtersStrategy,
        filtersList: newFiltersList,
        editingFilter: editingFilter,
        originalFilter: editingFilter,
        allowedFields
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
        filtersStrategy: null,
        filtersList: null,
        editingFilter: null,
        originalFilter: null,
        allowedFields: null
    });
}

function reduceFBuilderChangeFilter(state, action) {
    const {editingFilter} = state;
    const newParsedRules = applyFilterChange(
        editingFilter.parsedFilter,
        editingFilter.fieldDefaultId,
        editingFilter.sampleDefaultType,
        action.index,
        action.change
    );
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
                filter: i18n.changeEntityText(
                    state.editingFilter.filter,
                    'en',
                    {
                        name: action.name,
                        description: action.description
                    }
                )
            }) :
            null
    });
}

function reduceFBuilderOnSave(state, action) {
    return {
        ...state,
        onSaveAction: action.onSaveAction,
        onSaveActionProperty: action.onSaveActionProperty
    };
}

export default function filterBuilder(state = {
    filtersStrategy: null,
    filtersList: null,
    /** @type {?{filter: Object, parsedFilter: Object, isNew: boolean, filedDefaultId: string}} */
    editingFilter: null,
    originalFilter: null,
    allowedFields: null
}, action) {

    switch (action.type) {
        case ActionTypes.FBUILDER_CHANGE_FILTER:
            return reduceFBuilderChangeFilter(state, action);

        case ActionTypes.FBUILDER_CHANGE_ATTR:
            return reduceFBuilderChangeAttr(state, action);

        case ActionTypes.FBUILDER_START_EDIT:
            return reduceFBuilderStartEdit(state, action);

        case ActionTypes.FBUILDER_SAVE_EDIT:
            return reduceFBuilderSaveEdit(state);

        case ActionTypes.FBUILDER_END_EDIT:
            return reduceFBuilderEndEdit(state);

        case ActionTypes.FBUILDER_ON_SAVE:
            return reduceFBuilderOnSave(state, action);

        default:
            return state;
    }
}
