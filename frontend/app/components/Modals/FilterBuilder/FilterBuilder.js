import _ from 'lodash';
import React from 'react';
import Select from '../../shared/Select';
import Input from '../../shared/Input';
import InputResizingArray from '../../shared/InputResizingArray';
import InputArray from '../../shared/InputArray';
import QueryBuilder from '../../shared/QueryBuilder';
import FieldUtils from '../../../utils/fieldUtils';

import {
    filterBuilderChangeFilter
} from '../../../actions/filterBuilder';
import {
    filterUtils,
    opsUtils,
    genomicsParsedRulesValidate,
    isFilterComplexModel
} from '../../../utils/filterUtils';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import config from '../../../../config';


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


    static getFieldFilterItemRestrictions(item, field, fields) {
        const fieldJSType = FieldUtils.getFieldJSType(field);
        const allowedOpsTypes = FilterQueryBuilder.getValidOperatorsTypesForJSType(fieldJSType);
        const fieldValidationRegexp = FieldUtils.getFieldInputValidationRegex(field);
        return {
            item,
            fieldJSType,
            allowedOpsTypes,
            allowedFields: fields,
            fieldValidationRegexp
        };
    }

    static getDisabledFieldFilterItemRestrictions(item, field) {
        const fieldJSType = FieldUtils.getFieldJSType(field);
        const allowedOpsTypes = [item.operator];
        const allowedFields = [field];
        const fieldValidationRegexp = FieldUtils.getFieldInputValidationRegex(field);
        return {
            item: _.omit(item, 'sampleType'),
            fieldJSType,
            allowedOpsTypes,
            allowedFields,
            fieldValidationRegexp
        };
    }

    static onChangeItem(item, indexPath, allowedFields, dispatch) {
        if (!item || indexPath.length < 1) {
            return;
        }
        const ruleIndex = indexPath[indexPath.length - 1];
        const parentIndexPath = indexPath.slice(0, indexPath.length - 1);
        const selectedFieldId = item.field;
        const selectedField = FieldUtils.getFieldById(allowedFields, selectedFieldId);
        const selectedFieldJSType = FieldUtils.getFieldJSType(selectedField);
        const selectedOperatorType = item.operator;
        const selectedOperator = filterUtils.getOperatorByType(selectedOperatorType);
        const isOperatorAllowed = genomicsParsedRulesValidate.isAllowedOperatorType(selectedOperator, selectedFieldJSType);
        if (isOperatorAllowed) {
            dispatch(filterBuilderChangeFilter(parentIndexPath, {onEdit: {item, fieldJSType: selectedFieldJSType, ruleIndex}}));
        } else {
            dispatch(filterBuilderChangeFilter(parentIndexPath, {onEdit: {item: { field: item.field, sampleType: item.sampleType, operator: 'equal', value: item.value}, fieldJSType: selectedFieldJSType, ruleIndex}}));
        }
    }

    /**
     * Make filter rule item component
     * @param {{id: string, label: string, type: string}[]} allowedFields
     * @param {{id: string, label: string, type: string}[]} totalFields
     * @param {function(Object)} dispatch
     * @param {number[]} indexPath
     * @param {{field: string, sampleType: string=, operator: string, value: *}} item
     * @param {boolean} disabled
     * @returns {React.Component}
     */
    static makeFilterItem(allowedFields, totalFields, dispatch, indexPath, item, disabled) {
        const fieldFromSample = item.sampleType ?
            _.find(allowedFields, {id: item.field, sampleType: item.sampleType}) :
            _.find(allowedFields, {id: item.field});
        console.log(fieldFromSample);
        const itemRestrictions = fieldFromSample ?
            FilterQueryBuilder.getFieldFilterItemRestrictions(item, fieldFromSample, allowedFields) :
            FilterQueryBuilder.getDisabledFieldFilterItemRestrictions(item, FieldUtils.getFieldById(totalFields, item.field));
        return (
            <FieldFilterItem
                indexPath={indexPath}
                item={itemRestrictions.item}
                fields={itemRestrictions.allowedFields}
                allowedOpsTypes={itemRestrictions.allowedOpsTypes}
                valueType={itemRestrictions.fieldJSType}
                validationRegex = {itemRestrictions.fieldValidationRegexp}
                disabled={disabled || !fieldFromSample}
                onChange={ (item) => FilterQueryBuilder.onChangeItem(item, indexPath, allowedFields, dispatch) }
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
    static renderInputForSingleTextValue(value, disabled, onChange, validationRegex) {
        return (
            <Input
                className='form-control'
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                disabled={disabled}
                onChange={ (val) => onChange(val) }
                validationRegex={validationRegex}
                maxLength={config.FILTERS.MAX_VALUE_LENGTH}
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
                className='form-control'
                type='checkbox'
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
            <div className='rule-filter-container'>
                <Select
                    className='selectTree'
                    options={fieldsList}
                    value={fieldId}
                    disabled={disabled}
                    onChange={ (val) => onChange(val.value) }
                />
            </div>
        );
    }

    static renderOperatorSelect(operatorsList, operatorType, disabled, onChange) {
        return (
            <div className='rule-operator-container rule-operator-container-operation'>
                <Select
                    className='select2'
                    options={operatorsList}
                    value={operatorType}
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
            <div className='rule-value-array-item'>
                <Input {...props} className='form-control' />
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
    static renderInputsArray(ArrayComponent, value, valueType, disabled, onChange,  validationRegex) {
        return (
            <div className='rule-value-array'>
                <ArrayComponent
                    value={value}
                    type={valueType === 'number' ? 'number' : 'text'}
                    disabled={disabled}
                    InputComponent={FieldFilterItem.renderInputsArrayItem}
                    onChange={onChange}
                    validationRegex={validationRegex}
                    maxLength={config.FILTERS.MAX_VALUE_LENGTH}
                />
            </div>
        );
    }

    static renderItem(item, valueType, disabled, onChange, validationRegex) {
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
                (vals) => onChange(FieldFilterItem.itemChangeValue(item, getInputValueArray(vals))),
                validationRegex
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
            (val) => onChange(FieldFilterItem.itemChangeValue(item, val)),
            validationRegex
        );
    }

    /**
     * @param {{field: string, sampleType: string=, operator: string, value: *}} item
     * @param {{fieldId: string, sampleType: string=}} fieldIdSampleType
     * @returns {{field: string, sampleType: string=, operator: string, value: *}}
     */
    static itemChangeField(item, fieldIdSampleType) {
        const {fieldId, sampleType} = fieldIdSampleType;
        return {
            field: fieldId,
            sampleType: sampleType,
            operator: item.operator,
            value: item.value
        };
    }

    /**
     * @param {{field: string, sampleType: string=, operator: string, value: *}} item
     * @param {string} operatorType
     * @returns {{field: string, sampleType: string=, operator: string, value: *}}
     */
    static itemChangeOperatorType(item, operatorType) {
        return {
            field: item.field,
            sampleType: item.sampleType,
            operator: operatorType,
            value: item.value
        };
    }

    /**
     * @param {{field: string, sampleType: string=, operator: string, value: *}} item
     * @param {*} value
     * @returns {{field: string, sampleType: string=, operator: string, value: *}}
     */
    static itemChangeValue(item, value) {
        return {
            field: item.field,
            sampleType: item.sampleType,
            operator: item.operator,
            value: value
        };
    }

    /**
     * @param {string} fieldId
     * @param {string=} sampleType
     * @returns {string}
     */
    makeFieldIdWithSampleType(fieldId, sampleType) {
        return `${fieldId}${sampleType ? `_${sampleType}` : ''}`;
    }

    /**
     * @param {string} fieldIdSampleType
     * @returns {?{fieldId: string, sampleType: string=}}
     */
    parseFieldIdWithSampleType(fieldIdSampleType) {
        const match = fieldIdSampleType.match(/^([^_]*)(?:_(.*))?$/);
        if (!match) {
            return null;
        } else {
            return {
                fieldId: match[1],
                sampleType: match[2]
            };
        }
    }

    onItemChangeField(fieldSampleId) {
        const {item, onChange} = this.props;

        const parsedFieldSampleId = this.parseFieldIdWithSampleType(fieldSampleId);
        if (parsedFieldSampleId) {
            onChange(FieldFilterItem.itemChangeField(item, parsedFieldSampleId));
        }
    }

    render() { // TODO fields with sampleType?
        const {
            /** @type {{field: string, sampleType: string=, operator: string, value: *}} */
            item,
            /** @type {{id: string, sampleType: string=, label: string, type: string}[]} */
            fields,
            /** @type {string[]} */
            allowedOpsTypes,
            /** @type {string} */
            valueType,
            /** @type {boolean} */
            disabled,
            /** @type {function(?{field: string, sampleType: string=, operator: string, value: *})} */
            onChange,
            /** @type {string} */
            validationRegex
        } = this.props;

        /** @type {{value: string, label: string}[]} */
        const selectFieldList = fields.map((field) => {
            return {
                value: this.makeFieldIdWithSampleType(field.id, field.sampleType),
                fieldId: field.id,
                sampleType: field.sampleType,
                label: field.label
            };
        });
        /** @type {string} */
        const selectFieldValue = this.makeFieldIdWithSampleType(item.field, item.sampleType);
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
                    (fieldSampleId) => this.onItemChangeField(fieldSampleId)
                )}
                {FieldFilterItem.renderOperatorSelect(
                    selectOperatorList,
                    selectOperatorValue,
                    disabled,
                    (operatorType) => onChange(FieldFilterItem.itemChangeOperatorType(item, operatorType))
                )}
                <div className='rule-value-container'>
                    {FieldFilterItem.renderItem(item, valueType, disabled, onChange, validationRegex)}
                </div>
            </div>
        );
    }
}


export default class FilterBuilder extends React.Component {

    shouldComponentUpdate(nextProps) {
        return this.props.fields !== nextProps.fields
            || this.props.filterBuilder.editingFilter.filter.type !== nextProps.filterBuilder.editingFilter.filter.type
            || this.props.filterBuilder.editingFilter.parsedFilter !== nextProps.filterBuilder.editingFilter.parsedFilter;
    }

    render() {
        const {
            filterBuilder,
            fields,
            texts,
            ui: {languageId},
            dispatch
        } = this.props;
        const filter = filterBuilder.editingFilter.filter;
        const parsedFilter = filterBuilder.editingFilter.parsedFilter;
        const allowedFields = filterBuilder.allowedFields;
        return (
            <div className='builder-wrapper'>
                {!isFilterComplexModel(filter) ?
                    <FilterQueryBuilder
                        allowedFields={allowedFields.map( (f) => FieldUtils.makeFieldSelectItemValue(f, null, languageId) )}
                        totalFields={fields.totalFieldsHashedArray.array.map( (f) => FieldUtils.makeFieldSelectItemValue(f, null, languageId) )}
                        rules={parsedFilter}
                        disabled={!entityTypeIsEditable(filter.type)}
                        dispatch={dispatch}
                    /> :
                    <div>{`This ${texts.filter} has no rules to setup`}</div>
                }
            </div>
        );
    }
}
