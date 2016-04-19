import React from 'react';
import Select from 'react-select';
import Input from '../../shared/Input';
import InputResizingArray from '../../shared/InputResizingArray';
import InputArray from '../../shared/InputArray';
import QueryBuilder from '../../shared/QueryBuilder';
import FieldUtils from '../../../utils/fieldUtils'

import {
    filterBuilderChangeFilter
} from '../../../actions/filterBuilder';
import {
    filterUtils,
    opsUtils,
    genomicsParsedRulesValidate
} from '../../../utils/filterUtils';


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


class FilterQueryBuilder extends React.Component {

    /**
     * Get operators types (operator.type) for given value type
     * @param {string} type
     * @returns {string[]}
     */
    static getValidOperatorsTypesForJSType(type) {
        const ops = [];
        filterUtils.operators.map((op) => {
            if (genomicsParsedRulesValidate.isAllowedOperatorType(op, type))
                ops.push(op.type);
        });
        return ops;
    }

    /**
     * Get fields ids for given operation
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {{type: string, nbInput: number, multiple: boolean, applyTo: string[]}} operator
     * @returns {Object.<string, boolean>}
     */
    static getValidFieldsIdsForOperator(fields, operator) {
        const validFieldsIds = {};
        fields.map( (field) => {
            const fieldJSType = FieldUtils.getFieldJSType(field);
            if (genomicsParsedRulesValidate.isAllowedOperatorType(operator, fieldJSType)) {
                validFieldsIds[field.id] = true;
            }
        });
        return validFieldsIds;
    }

    /**
     * Make filter rule item component
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {function(Object)} dispatch
     * @param {number[]} index
     * @param {{field: string, operator: string, value: *}} item
     * @param {boolean} disabled
     * @returns {React.Component}
     */
    static makeFilterItem(fields, dispatch, index, item, disabled) {
        const fieldJSType = FieldUtils.getFieldJSType(FieldUtils.getFieldById(fields, item.field));
        const allowedOpsTypes = this.getValidOperatorsTypesForJSType(fieldJSType);
        const allowedFieldsIds = this.getValidFieldsIdsForOperator(fields, filterUtils.getOperatorByType(item.operator));
        const allowedFields = fields.filter((f) => allowedFieldsIds[f.id]);
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

    static makeFilterQueryBuilderHandlers(dispatch) {
        return {
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
    }

    render() {

        const {
            /** @type {{id: string, label: string, type: string}[]} */
            fields,
            /** @type {{$and: ({id, label, type}|Object)[]=, $or: ({id, label, type}|Object)[]= }} */
            rules,
            /** @type {boolean} */
            disabled,
            /** @type function(Object) */
            dispatch
        } = this.props;

        return (
            <QueryBuilder
                rules={rules}
                disabled={disabled}
                makeItemComponent={FilterQueryBuilder.makeFilterItem.bind(FilterQueryBuilder, fields, dispatch)}
                handlers={FilterQueryBuilder.makeFilterQueryBuilderHandlers(dispatch)}
            />
        );
    }
}


class FieldFilterItem extends React.Component {

    /**
     * @param {string|number} value
     * @param {boolean} disabled
     * @param {function(string)} onChange
     * @returns {React.Component}
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
     * @returns {React.Component}
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
     * @returns {React.Component}
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
     * @returns {React.Component}
     */
    static renderInputsArrayItem(props) {
        return (
            <div className="rule-value-array-item">
                <Input {...props} className="form-control" />
            </div>
        );
    }

    /**
     * @param {React.Component} ArrayComponent
     * @param {(number|string)[]} value
     * @param {string} valueType
     * @param {boolean} disabled
     * @param {function(string[])} onChange
     * @returns {React.Component}
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
        const {
            /** {number[]} */
            index,
            /** @type {{field: string, operator: string, value: *}} */
            item,
            /** @type {{id: string, label: string, type: string}[]} */
            fields,
            /** @type {string[]} */
            allowedOpsTypes,
            /** @type {string} */
            valueType,
            /** @type {boolean} */
            disabled,
            /** @type {function({field: string, operator: string, value: *})} */
            onChange
        } = this.props;

        /** @type {{value: string, label: string}[]} */
        const selectFieldList = fields.map((field) => {
            return {value: field.id, label: field.label}
        });
        /** @type {string} */
        const selectFieldValue = item.field;

        /** @type {{value: string, label: string}[]} */
        const selectOperatorList = allowedOpsTypes.map((opname) => {
            return {value: opname, label: opsUtils.genomicsRuleOperatorsLabels[opname]};
        });
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


export default class FilterBuilder extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.filterBuilder !== nextProps.filterBuilder;
    }

    render() {
        const {
            filterBuilder,
            fields,
            dispatch
        } = this.props;
        const filter = filterBuilder.editingFilter.filter;
        const parsedFilter = filterBuilder.editingFilter.parsedFilter;
        return (
            <div className="builder-wrapper">
                <FilterQueryBuilder
                    fields={FieldUtils.makeFieldsListForFiltersSelect(fields)}
                    rules={parsedFilter}
                    disabled={filter.type === 'standard' || filter.type === 'advanced'}
                    dispatch={dispatch}
                />
            </div>
        );
    }
}
