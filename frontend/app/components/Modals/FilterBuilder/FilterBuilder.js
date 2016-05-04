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
    indexPath: number[]
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
     * @param {{type: string, nbInputs: number, multiple: boolean, applyTo: string[]}} operator
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

    static getFieldFilterItemRestrictions(field, fields, operator) {
        const fieldJSType = FieldUtils.getFieldJSType(field);
        const allowedOpsTypes = this.getValidOperatorsTypesForJSType(fieldJSType);
        const allowedFieldsIds = this.getValidFieldsIdsForOperator(fields, filterUtils.getOperatorByType(operator));
        const allowedFields = fields.filter( (f) => allowedFieldsIds[f.id] );
        return {
            fieldJSType,
            allowedOpsTypes,
            allowedFields
        };
    }

    static getDisabledFieldFilterItemRestrictions(field, operator) {
        const fieldJSType = FieldUtils.getFieldJSType(field);
        const allowedOpsTypes = [operator];
        const allowedFields = [field];
        return {
            fieldJSType,
            allowedOpsTypes,
            allowedFields
        };
    }

    /**
     * Make filter rule item component
     * @param {{id: string, label: string, type: string}[]} allowedFields
     * @param {{id: string, label: string, type: string}[]} totalFields
     * @param {function(Object)} dispatch
     * @param {number[]} indexPath
     * @param {{field: string, operator: string, value: *}} item
     * @param {boolean} disabled
     * @returns {React.Component}
     */
    static makeFilterItem(allowedFields, totalFields, dispatch, indexPath, item, disabled) {
        const fieldFromSample = FieldUtils.getFieldById(allowedFields, item.field);
        const itemRestrictions = fieldFromSample ?
            this.getFieldFilterItemRestrictions(fieldFromSample, allowedFields, item.operator) :
            this.getDisabledFieldFilterItemRestrictions(FieldUtils.getFieldById(totalFields, item.field), item.operator);
        return (
            <FieldFilterItem
                indexPath={indexPath}
                item={item}
                fields={itemRestrictions.allowedFields}
                allowedOpsTypes={itemRestrictions.allowedOpsTypes}
                valueType={itemRestrictions.fieldJSType}
                disabled={disabled || !fieldFromSample}
                onChange={ (item) => {
                            if (indexPath.length < 1) {
                                return;
                            }
                            const ruleIndex = indexPath[indexPath.length - 1];
                            const newFieldId = item.field;
                            const newFieldFromSample = FieldUtils.getFieldById(allowedFields, newFieldId);
                            const newFieldJSType = FieldUtils.getFieldJSType(newFieldFromSample);
                            dispatch(filterBuilderChangeFilter(indexPath.slice(0, indexPath.length - 1), {onEdit: {item, fieldJSType: newFieldJSType, ruleIndex}}));
                        }}
            />
        );
    }

    static makeFilterQueryBuilderHandlers(dispatch) {
        return {
            onSwitch(/** number[] */indexPath, /** boolean */isAnd) {
                dispatch(filterBuilderChangeFilter(indexPath, {onSwitch: isAnd}));
            },
            onAdd(/** number[] */indexPath, /** boolean */isGroup) {
                dispatch(filterBuilderChangeFilter(indexPath, {onAdd: isGroup}));
            },
            onDeleteGroup(/** number[] */indexPath) {
                if (indexPath.length < 1) {
                    return;
                }
                const groupIndex = indexPath[indexPath.length - 1];
                dispatch(filterBuilderChangeFilter(indexPath.slice(0, indexPath.length - 1), {onDelete: groupIndex}));
            },
            onDeleteItem(/** number[] */indexPath, /** number */itemIndex) {
                dispatch(filterBuilderChangeFilter(indexPath, {onDelete: itemIndex}));
            }
        };
    }

    render() {

        const {
            /** @type {{id: string, label: string, type: string}[]} */
            allowedFields,
            /** @type {{id: string, label: string, type: string}[]} */
            totalFields,
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
                makeItemComponent={ (indexPath, item, disabled) => FilterQueryBuilder.makeFilterItem(allowedFields, totalFields, dispatch, indexPath, item, disabled) }
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

    static renderItem(item, valueType, disabled, onChange) {
        const value = item.value;
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
            return FieldFilterItem.renderInputsArray(
                InputArrayComponent,
                value,
                valueType,
                disabled,
                (vals) => onChange(FieldFilterItem.itemChangeValue(item, getInputValueArray(vals)))
            );
        }
        if (typeof value === 'boolean') {
            return FieldFilterItem.renderCheckbox(
                value,
                disabled,
                (val) => onChange(FieldFilterItem.itemChangeValue(item, val))
            );
        }
        return FieldFilterItem.renderInputForSingleTextValue(
            value,
            disabled,
            (val) => onChange(FieldFilterItem.itemChangeValue(item, val))
        );
    }

    /**
     * @param {{field: string, operator: string, value: *}} item
     * @param {string} fieldId
     * @returns {{field: string, operator: string, value: *}}
     */
    static itemChangeField(item, fieldId) {
        return {
            field: fieldId,
            operator: item.operator,
            value: item.value
        };
    }

    /**
     * @param {{field: string, operator: string, value: *}} item
     * @param {string} operatorType
     * @returns {{field: string, operator: string, value: *}}
     */
    static itemChangeOperatorType(item, operatorType) {
        return {
            field: item.field,
            operator: operatorType,
            value: item.value
        };
    }

    /**
     * @param {{field: string, operator: string, value: *}} item
     * @param {*} value
     * @returns {{field: string, operator: string, value: *}}
     */
    static itemChangeValue(item, value) {
        return {
            field: item.field,
            operator: item.operator,
            value: value
        };
    }

    render() {
        const {
            /** {number[]} */
            indexPath,
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

        return (
            <div>
                {FieldFilterItem.renderFieldSelect(
                    selectFieldList,
                    selectFieldValue,
                    disabled,
                    (fieldId) => onChange(FieldFilterItem.itemChangeField(item, fieldId))
                )}
                {FieldFilterItem.renderOperatorSelect(
                    selectOperatorList,
                    selectOperatorValue,
                    disabled,
                    (operatorType) => onChange(FieldFilterItem.itemChangeOperatorType(item, operatorType))
                )}
                <div className="rule-value-container">
                    {FieldFilterItem.renderItem(item, valueType, disabled, onChange)}
                </div>
            </div>
        )
    }
}


export default class FilterBuilder extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.filterBuilder.editingFilter.filter.type !== nextProps.filterBuilder.editingFilter.filter.type
            || this.props.filterBuilder.editingFilter.parsedFilter !== nextProps.filterBuilder.editingFilter.parsedFilter;
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
                    allowedFields={fields.allowedFieldsList.map( (f) => FieldUtils.makeFieldSelectItemValue(f) )}
                    totalFields={fields.totalFieldsList.map( (f) => FieldUtils.makeFieldSelectItemValue(f) )}
                    rules={parsedFilter}
                    disabled={filter.type === 'standard' || filter.type === 'advanced' || filter.type === 'history'}
                    dispatch={dispatch}
                />
            </div>
        );
    }
}
