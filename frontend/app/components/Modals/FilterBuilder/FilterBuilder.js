import React, { Component } from 'react';
import Select from 'react-select';
import Input from '../../shared/Input';
import InputResizingArray from '../../shared/InputResizingArray';
import InputArray from '../../shared/InputArray';
import QueryBuilder from '../../shared/QueryBuilder';
import FieldUtils from '../../../utils/fieldUtils'

import { filterBuilderChangeAll, filterBuilderChangeFilter } from '../../../actions/filterBuilder';

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

        const handlers = {
            onSwitch(/** number[] */index, /** boolean */isAnd) {
                dispatch(filterBuilderChangeFilter(index, {onSwitch: isAnd}));
            },
            onAdd(/** number[] */index, /** boolean */isGroup) {
                dispatch(filterBuilderChangeFilter(index, {onAdd: isGroup}));
            },
            onDeleteGroup(/** number[] */index) {
                if (index.length < 1) {
                    return;
                }
                const groupIndex = index[index.length - 1];
                dispatch(filterBuilderChangeFilter(index.slice(0, index.length - 1), {onDelete: groupIndex}));
            },
            onDeleteItem(/** number[] */index, /** number */itemIndex) {
                dispatch(filterBuilderChangeFilter(index, {onDelete: itemIndex}));
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
                        if (index.length < 1) {
                            return;
                        }
                        const ruleIndex = index[index.length - 1];
                        dispatch(filterBuilderChangeFilter(index.slice(0, index.length - 1), {onEdit: {item, fieldJSType, ruleIndex}}));
                    }}
                />
            );
        }

        return (
            <QueryBuilder
                rules={rules}
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
                    rules={this.props.filterBuilder.editingFilter.parsedFilter}
                    disabled={filter.type === 'standard' || filter.type === 'advanced'}
                    dispatch={this.props.dispatch}
                />
            </div>
        );
    }
}
