import React, { Component } from 'react';
import Select from 'react-select';
import Input from '../../shared/Input';
import InputResizingArray from '../../shared/InputResizingArray';
import InputArray from '../../shared/InputArray';
import QueryBuilder from '../../shared/QueryBuilder';
import FieldUtils from '../../../utils/fieldUtils'

import { filterBuilderChangeAll } from '../../../actions/filterBuilder';

import {filterUtils, fieldUtils, opsUtils, genomicsParsedRulesValidate} from '../../../utils/filterUtils';


/**

FieldFilterItem(
    index: number[]
    item: {field: string, operator: string, value: *}
    fields: {id: string, label: string, type: string}[]
    allowedOpsTypes: string[]
    valueType: string
    disabled: boolean
    onChange: function({field: string, operator: string, value: *})
)

 */


class FilterQueryBuilder extends Component {
    render() {
        /** @type {{id: string, label: string, type: string}[]} */
        const fields = this.props.fields;
        /** @type {{$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }} */
        const rules = this.props.rules;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type function(Object) */
        const dispatch = this.props.dispatch;

        /**
         * Get operators types (operator.type) for given value type
         * @param {string} type
         * @returns {string[]}
         */
        function getValidOperatorsTypesForJSType(type) {
            var ops = [];
            filterUtils.operators.map( (op) => { if (genomicsParsedRulesValidate.isAllowedOperatorType(op, type)) ops.push(op.type); } );
            return ops;
        }

        /**
         * Get fields ids for given operation
         * @param {{id: string, label: string, type: string}[]} fields
         * @param {{type: string, nbInput: number, multiple: boolean, applyTo: string[]}} operator
         * @returns {Object.<string, boolean>}
         */
        function getValidFieldsIdsForOperator(fields, operator) {
            var validFieldsIds = {};
            fields.map( (field) => {
                const fieldJSType = fieldUtils.getFieldJSType(field);
                if (genomicsParsedRulesValidate.isAllowedOperatorType(operator, fieldJSType)) {
                    validFieldsIds[field.id] = true;
                }
            });
            return validFieldsIds;
        }

        /** @type {string} */
        const fieldDefaultId = fieldUtils.getDefaultId(fields);

        const parsedRawRules = filterUtils.getRulesFromGenomics(rules);
        const validateRulesResult = genomicsParsedRulesValidate.validateGemonicsParsedRules(fields, parsedRawRules);

        // Make default rules if not parsed
        var parsedRules = validateRulesResult.validRules ||
            {condition : 'AND', rules: [{field: fieldDefaultId, operator: 'is_null'}]};

        // Report validation results if any
        if (validateRulesResult.report.length) {
            console.error('Filter rules are invalid:');
            console.error(JSON.stringify(parsedRawRules, null, 4));
            console.error('Filter validation report:');
            console.error(JSON.stringify(validateRulesResult.report, null, 4));
        }


        /**
         * Return subrules for given index, [] - root and so on
         * @param {{condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}} rules
         * @param {number[]} index
         * @returns {{condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}}
         */
        function findSubrules(rules, index) {
            var searchIndex = index.slice();
            var subrules = rules;
            var indexNow;
            while (searchIndex.length) {
                subrules = subrules.rules;
                indexNow = searchIndex.shift();
                subrules = subrules[indexNow];
            }
            return subrules;
        }

        /**
         * Return subrules and index in it for given index, [] - return root and null, [1, 2] - return 1st group and 2 as index
         * @param {{condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}} rules
         * @param {number[]} index
         * @returns {{subrules: {condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}, indexIn: number|null}}
         */
        function findSubrulesWIndex(rules, index) {
            var searchIndex = index.slice();
            var subrules = rules;
            var indexIn = null;
            while (searchIndex.length) {
                subrules = subrules.rules;
                indexIn = searchIndex.shift();
                if (searchIndex.length) {
                    subrules = subrules[indexIn];
                }
            }
            return {subrules: subrules, indexIn: indexIn};
        }

        const handlers = {
            onSwitch(/** number[] */index, /** boolean */isAnd) {
                const subrules = findSubrules(parsedRules, index);
                subrules.condition = isAnd ? 'AND' : 'OR';

                dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
            },
            onAdd(/** number[] */index, /** boolean */isGroup) {
                const subrules = findSubrules(parsedRules, index);
                if (isGroup) {
                    subrules.rules.push({condition: 'AND', rules: [{id: fieldDefaultId, field: fieldDefaultId, operator: 'is_null', value: null}]});
                } else {
                    subrules.rules.push({id: fieldDefaultId, field: fieldDefaultId, operator: 'is_null', value: null});
                }
                dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
            },
            onDeleteGroup(/** number[] */index) {
                const {subrules, indexIn} = findSubrulesWIndex(parsedRules, index);
                if (indexIn != null && subrules.length > 1) {
                    subrules.splice(indexIn, 1);
                    dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                }
            },
            onDeleteItem(/** number[] */index, /** number */itemIndex) {
                const subrules = findSubrules(parsedRules, index);
                if (subrules.rules.length > 1) {
                    subrules.rules.splice(itemIndex, 1);
                    dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                }
            }
        };

        /**
         * Make filter rule item component
         * @param {number[]} index
         * @param {{field: string, operator: string, value: *}} item
         * @param {boolean} disabled
         * @returns {Component}
         */
        function makeFilterItem(index, item, disabled) {

            const fieldJSType = fieldUtils.getFieldJSType(fieldUtils.getFieldById(fields, item.field));
            const allowedOpsTypes = getValidOperatorsTypesForJSType(fieldJSType);
            const allowedFieldsIds = getValidFieldsIdsForOperator(fields, filterUtils.getOperatorByType(item.operator));
            const allowedFields =  fields.filter( (f) => allowedFieldsIds[f.id] );
            return (
                <FieldFilterItem
                    index={index}
                    item={item}
                    fields={allowedFields}
                    allowedOpsTypes={allowedOpsTypes}
                    valueType={fieldJSType}
                    disabled={disabled}
                    onChange={ (item) => {
                        const itemOpType = item.operator;
                        const itemOp = filterUtils.getOperatorByType(itemOpType);
                        const opWant = opsUtils.getOperatorWantedParams(itemOp);
                        const value = item.value;
                        const castedValue = opWant.noParams ?
                            null :
                            opWant.single ?
                                (typeof value === 'object' && value && value.length) ? genomicsParsedRulesValidate.jsTypeCastValue(value.join(), fieldJSType) : genomicsParsedRulesValidate.jsTypeCastValue(value, fieldJSType) :
                                genomicsParsedRulesValidate.jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);
                        item.value = castedValue;
                        const {subrules, indexIn} = findSubrulesWIndex(parsedRules, index);
                        subrules[indexIn] = item;
                        dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                    }}
                />
            );
        }

        return (
            <QueryBuilder
                rules={parsedRules}
                disabled={disabled}
                makeItemComponent={makeFilterItem}
                handlers={handlers}
            />
        );
    }
}


class FieldFilterItem extends Component {

    /**
     * @param {string|number} value
     * @param {boolean} disabled
     * @param {function(string)} onChange
     * @returns {Component}
     */
    static renderInputForSingleTextValue(value, disabled, onChange) {
        return (
            <Input
                className="form-control"
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                disabled={disabled}
                onChange={ (val) => onChange(val) }
            />
        );
    }

    /**
     * @param {boolean} checked
     * @param {boolean} disabled
     * @param {function(boolean)} onChange
     * @returns {Component}
     */
    static renderCheckbox(checked, disabled, onChange) {
        return (
            <input
                className="form-control"
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={ (evt) => onChange(evt.target.checked) }
            />
        );
    }

    /**
     * @param {{value: string, label: string}[]} fieldsList
     * @param {string} fieldId
     * @param {boolean} disabled
     * @param {function(string)} onChange
     * @returns {Component}
     */
    static renderFieldSelect(fieldsList, fieldId, disabled, onChange) {
        return (
            <div className="rule-filter-container">
                <Select
                    className="selectTree"
                    options={fieldsList}
                    value={fieldId}
                    clearable={false}
                    disabled={disabled}
                    onChange={ (val) => onChange(val.value) }
                />
            </div>
        );
    }

    static renderOperatorSelect(operatorsList, operatorType, disabled, onChange) {
        return (
            <div className="rule-operator-container rule-operator-container-operation">
                <Select
                    className="select2"
                    options={operatorsList}
                    value={operatorType}
                    clearable={false}
                    disabled={disabled}
                    onChange={ (val) => onChange(val.value) }
                />
            </div>
        );
    }

    /**
     * @param {Object} props
     * @returns {Component}
     */
    static renderInputsArrayItem(props) {
        return (
            <div className="rule-value-array-item">
                <Input {...props} className="form-control" />
            </div>
        );
    }

    /**
     * @param {Component} ArrayComponent
     * @param {(number|string)[]} value
     * @param {string} valueType
     * @param {boolean} disabled
     * @param {function(string[])} onChange
     * @returns {Component}
     */
    static renderInputsArray(ArrayComponent, value, valueType, disabled, onChange) {
        return (
            <div className="rule-value-array">
                <ArrayComponent
                    value={value}
                    type={valueType === 'number' ? 'number' : 'text'}
                    disabled={disabled}
                    InputComponent={FieldFilterItem.renderInputsArrayItem}
                    onChange={onChange}
                />
            </div>
        );
    }

    render() {
        /** {number[]} */
        const index = this.props.index;
        /** @type {{field: string, operator: string, value: *}} */
        const item = this.props.item;
        /** @type {{id: string, label: string, type: string}[]} */
        const fields = this.props.fields;
        /** @type {string[]} */
        const allowedOpsTypes = this.props.allowedOpsTypes;
        /** @type {string} */
        const valueType = this.props.valueType;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {function({field: string, operator: string, value: *})} */
        const onChange = this.props.onChange;

        /** @type {{value: string, label: string}[]} */
        const selectFieldList = fields.map( (field) => { return {value: field.id, label: field.label} } );
        /** @type {string} */
        const selectFieldValue = item.field;

        /** @type {{value: string, label: string}[]} */
        const selectOperatorList = allowedOpsTypes.map( (opname) => { return {value: opname, label: opsUtils.genomicsRuleOperatorsLabels[opname]}; });
        /** @type {string} */
        const selectOperatorValue = item.operator;

        /**
         * @param {string} fieldId
         */
        function onFieldSelectChange(fieldId) {
            onChange({
                id: fieldId,
                field: fieldId,
                operator: item.operator,
                value: item.value
            });
        }

        /**
         * @param {string} operatorType
         */
        function onOperatorSelectChange(operatorType) {
            onChange({
                id: item.id,
                field: item.field,
                operator: operatorType,
                value: item.value
            });
        }

        /**
         * @param {*} value
         */
        function onItemValueChange(value) {
            onChange({
                id: item.id,
                field: item.field,
                operator: item.operator,
                value: value
            });
        }

        return (
            <div>
                {FieldFilterItem.renderFieldSelect(selectFieldList, selectFieldValue, disabled, onFieldSelectChange)}
                {FieldFilterItem.renderOperatorSelect(selectOperatorList, selectOperatorValue, disabled, onOperatorSelectChange)}
                <div className="rule-value-container">
                    {(function(value){

                        /** @type function(string|number):(string|number) */
                        const getInputValue = valueType === 'number' ? (v) => +v : (v) => v;
                        /**
                         * @param {(string|number)[]} arr
                         * @returns {(string|number)[]}
                         */
                        function getInputValueArray(arr) {
                            return arr.map( (val) => getInputValue(val) );
                        }

                        if (typeof value === 'object') {
                            if (!value) {
                                return null;
                            }

                            const operatorInfo = filterUtils.getOperatorByType(item.operator);
                            const opWant = opsUtils.getOperatorWantedParams(operatorInfo);
                            const InputArrayComponent = opWant.arraySize ? InputArray : InputResizingArray;
                            return FieldFilterItem.renderInputsArray(InputArrayComponent, value, valueType, disabled, (vals) => onItemValueChange(getInputValueArray(vals)) );
                        }
                        if (typeof value === 'boolean') {
                            return FieldFilterItem.renderCheckbox(item.value, disabled, onItemValueChange);
                        }
                        return FieldFilterItem.renderInputForSingleTextValue(
                            value,
                            disabled,
                            (val) => onChange({
                                id: item.id,
                                field: item.field,
                                operator: item.operator,
                                value: getInputValue(val)
                            })
                        );

                    })(item.value)}
                </div>
            </div>
        )
    }
}


export default class FilterBuilder extends Component {

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.filterBuilder !== nextProps.filterBuilder;
    }

    render() {
        const filter = this.props.filterBuilder.editingFilter.filter;
        return (
            <div className="builder-wrapper">
                <FilterQueryBuilder
                    fields={FieldUtils.makeFieldsList(this.props.fields)}
                    rules={filter.rules}
                    disabled={filter.type === 'standard' || filter.type === 'advanced'}
                    dispatch={this.props.dispatch}
                />
            </div>
        );
    }
}
