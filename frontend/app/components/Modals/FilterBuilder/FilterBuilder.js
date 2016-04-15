import React, { Component } from 'react';
import Select from 'react-select';

import { filterBuilderChangeAll } from '../../../actions/filterBuilder';

import filterUtils from '../../../utils/filterUtils';


const opsUtils = {
    /**
     * Map operator type to operator label
     */
    genomicsRuleOperatorsLabels: {
        "equal": "equal",
        "not_equal": "not equal",
        "in": "in",
        "not_in": "not in",
        "less": "less",
        "less_or_equal": "less or equal",
        "greater": "greater",
        "greater_or_equal": "greater or equal",
        "between": "between",
        "not_between": "not between",
        "begins_with": "begins with",
        "not_begins_with": "doesn't begin with",
        "contains": "contains",
        "not_contains": "doesn't contain",
        "ends_with": "ends with",
        "not_ends_with": "doesn't end with",
        "is_null": "is null",
        "is_not_null": "is not null"
    },
    /**
     * Return operator wanted params count
     * Object contains one of properties:
     *   noParams - operator does not want any params
     *   single - operator want single parameter
     *   arrayDynamic - operator wants dynamic-size array
     *   arraySize - operator wants fixed-size array of arraySize length
     * @param {{type: string, nbInput: number, multiple: boolean, applyTo: string[]}} operatorInfo as in filterUtils.operators
     * @returns {{noParams: boolean=, single: boolean=, arrayDynamic: boolean=, arraySize: number=}}
     */
    getOperatorWantedParams: function(operatorInfo) {
        if (!operatorInfo.nbInputs) {
            return {noParams: true};
        }
        if (operatorInfo.nbInputs <= 1 && !operatorInfo.multiple) {
            return {single: true};
        }
        if (operatorInfo.multiple) {
            return {arrayDynamic: true};
        } else {
            return {arraySize: operatorInfo.nbInputs};
        }
    }
};

const fieldUtils = {
    /**
     * Return default field id for adding new rule item or smth
     * @param {{id: string, label: string, type: string}[]} fields
     * @returns {string}
     */
    getDefaultId(fields) {
        return fields[0].id;
    },
    /**
     * Get JS type for the field value or undefined
     * @param {{id: string, label: string, type: string}} field
     * @returns {string|undefined}
     */
    getFieldJSType(field) {
        const fieldType = field.type;
        const jsType = {
            'char': 'string',
            'string': 'string',
            'integer': 'number',
            'float': 'number',
            'double': 'number',
            'boolean': 'boolean'
        }[fieldType];
        return jsType;
    }
};



/**

 Inner structure:

FilterQueryBuilder(
     fields: {{id: string, label: string, type: string}[]}
     rules: {{ <'$and'|'$or'>: ({id, label, type}|rules)[] }}
     disabled: boolean
     dispatch: function(Object)
)
    QueryBuilder(
        rules: {{condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}}
        disabled: boolean
        makeItemComponent: function(number[], {field: string, operator: string, value: *}, boolean): Component
        handlers: {
            onSwitch: function(number[], boolean),
            onAdd: function(number[], boolean),
            onDeleteGroup: function(number[]),
            onDeleteItem: function(number[], boolean)
        }
    )
        RulesGroupContainer(
            index: number[] // [] - root, [1, 2] - 2nd child at 1st child of root
            makeItemComponent: = makeItemComponent
            ruleItems: {condition?: *, field?: string, operator?: string, value?: *}[]
            ruleIsAnd: boolean
            disabled: = disabled
            handlers: = handlers
        )
            RulesGroupHeader(
                index: = index
                disabled: = disabled
                isAnd: = ruleIsAnd
                onSwitch: function(boolean)
                onAdd: function(boolean)
                onDelete: function()
            )
            RulesGroupBody(
                index: = index
                items: = ruleItems
                disabled: = disabled
                makeItemComponent: = makeItemComponent
                handlers: = handlers
            )
                RulesGroupContainer(...)
                RuleContainer(
                    index: number[]
                    item: {condition?: *, field?: string, operator?: string, value?: *}
                    disabled: = disabled
                    makeItemComponent: = makeItemComponent
                    onDelete: function()
                )
                    itemComponent(
                        number[],
                        {field: string, operator: string, value: *},
                        boolean
                    )


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
         * Return field for id
         * @param {string} id
         * @returns {{id: string, label: string, type: string}}
         */
        function getFieldById(id) {
            var i;
            for (i = 0; i < fields.length; i++) {
                if (id == fields[i].id) {
                    return fields[i];
                }
            }
        }

        /**
         * Type cast value (single value, not an object or array) to desired type
         * @param {*} val
         * @param {string} type
         * @returns {*|null}
         */
        function jsTypeCastValue(val, type) {
            var cast = {
                'string': (val) => typeof val === 'object' ? '' : '' + val,
                'number': (val) => +val || 0,
                'boolean': (val) => val === 'false' ? false : !!val
            }[type];
            return cast ? cast(val) : null;
        }

        /**
         * Type cast single value or array to desired typed array
         * 'len' is optional parameter. If it set then make result array exactly that length
         * either by cutting or enlarging it
         * @param {*|array} val
         * @param {string} type
         * @param {number=} len
         * @returns {*}
         */
        function jsTypeCastArray(val, type, len) {
            if (!val || typeof val !== 'object' || !val.length) {
                return new Array(len || 1).fill(jsTypeCastValue(val, type));
            } else {
                return val
                    .slice(0, len ? len : val.length)
                    .map((v) => jsTypeCastValue(v, type))
                    .concat(
                        new Array(len > val.length ? len - val.length : 0)
                            .fill(jsTypeCastValue(val[val.length - 1], type))
                    );
            }
        }

        /**
         * Return true if operator allows given argument type
         * @param {{type: string, nbInput: number, multiple: boolean, applyTo: string[]}} operator as in filterUtils.operators
         * @param {string} type
         * @returns {boolean}
         */
        function isAllowedOperatorType(operator, type) {
            return operator.applyTo.indexOf(type) >= 0;
        }

        /**
         * Get operators types (operator.type) for given value type
         * @param {string} type
         * @returns {string[]}
         */
        function getValidOperatorsTypesForJSType(type) {
            var ops = [];
            filterUtils.operators.map( (op) => { if (isAllowedOperatorType(op, type)) ops.push(op.type); } );
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
                if (isAllowedOperatorType(operator, fieldJSType)) {
                    validFieldsIds[field.id] = true;
                }
            });
            return validFieldsIds;
        }

        /**
         * Validate parsed rules, return rules with valid items only (can be null) and validation report
         * Report is an array of object with message and index (nested group indexes, [] is root) in source rules
         * @param {{condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}} rules
         * @returns {{validRules: {condition: string, rules: {condition?: *, field?: string, operator?: string, value?: *}[]}, report: {index: number[], message: string}[]}}
         */
        function validateRules(rules) {

            /**
             * Validate rule item (field, operator, value), return valid rule,
             * rules group flag (groups are not validating here) or error message
             * Result value is type casted for field type
             * @param {?{condition: *=, field: string=, operator: string=, value: *=}} rule
             * @returns {{errorMessage: string=, isGroup: boolean=, validRule: {field: string, operator: string, value:*}=}}
             */
            function validateRule(rule) {
                if (!rule) {
                    return {errorMessage: 'no rule'};
                }
                if (rule.condition) {
                    return {isGroup: true};
                }
                if (!rule.field) {
                    return({errorMessage: 'no field'});
                }
                if (!rule.operator) {
                    return ({errorMessage: 'no operator'});
                }

                const field = getFieldById(rule.field);
                if (!field) {
                    return {errorMessage: 'field id "' + rule.field + '" is invalid'};
                }
                const fieldJSType = fieldUtils.getFieldJSType(field);
                const operatorType = rule.operator;
                const operatorInfo = filterUtils.getOperatorByType(operatorType);

                if (!isAllowedOperatorType(operatorInfo, fieldJSType)) {
                    return {errorMessage: 'field "' + JSON.stringify(field) + '" of type "' + fieldJSType + '" not allowed for operator "' + operatorType + '"'};
                }

                const opWant = opsUtils.getOperatorWantedParams(operatorInfo);

                const value = rule.value;
                const castedValue = opWant.noParams ?
                    null :
                    opWant.single ?
                        jsTypeCastValue(value, fieldJSType) :
                        jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);

                return {validRule: {
                    field: rule.field,
                    operator: rule.operator,
                    value: castedValue
                }};
            }

            /**
             * Validate rules array
             * Return valid rules
             * Append validation report
             * @param {{condition: *=, field: string=, operator: string=, value: *=}[]}rules
             * @param {number[]} index current rules group position, [] for root rules group, [1, 2] for 2nd group in 1st group in root
             * @param {{index: number[], message: string}[]} report messages for rules in original rules tree
             * @returns {{field: string, operator: string, value:*}[]}
             */
            function validateRules(rules, index, report) {
                var validRules = [];
                rules.map( (rule, i) => {
                    var validateRuleResult = validateRule(rule);
                    if (validateRuleResult.validRule) {
                        validRules.push(validateRuleResult.validRule);
                        return;
                    }
                    const ruleIndex = index.concat([i]);
                    if (validateRuleResult.isGroup) {
                        const validSubGroup = validateGroup(rule, ruleIndex, report);
                        if (!validSubGroup) {
                            report.push({index: ruleIndex.slice(), message: 'invalid subgroup'});
                            return;
                        }
                        validRules.push(validSubGroup);
                        return;
                    }
                    report.push({index: ruleIndex, message: validateRuleResult.errorMessage});
                });
                return validRules;
            }

            /**
             * Validate rules group
             * Return valid group or null
             * Append validation report
             * @param {{condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}} group
             * @param {number[]} index
             * @param {{index: number[], message: string}[]} report
             * @returns {?{condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}}
             */
            function validateGroup(group, index, report) {
                if (group.condition !== 'AND' && group.condition !== 'OR') {
                    report.push({index: index.slice(), message: 'bad group condition "' + group.condition + '" (must be AND|OR)'});
                    return null;
                }
                if (!group.rules || typeof group.rules !== 'object' || !group.rules.length) {
                    report.push({index: index.slice(), message: 'group content (type ' + typeof group.rules + ', !!rule=' + !!group.rules + (group.rules ? ', len = ' + group.rules.length : '') + ')'});
                    return null;
                }
                const validRules = validateRules(group.rules, index, report);
                if (!validRules.length) {
                    report.push({index: index.slice(), message: 'empty group'});
                    return null;
                }
                return {condition: group.condition, rules: validRules};
            }

            var report = [];
            var validRules = validateGroup(rules, [], report);

            return {validRules: validRules, report: report};
        }

        /** @type {string} */
        const fieldDefaultId = fieldUtils.getDefaultId(fields);

        const parsedRawRules = filterUtils.getRulesFromGenomics(rules);
        const validateRulesResult = validateRules(parsedRawRules);

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

            const fieldJSType = fieldUtils.getFieldJSType(getFieldById(item.field));
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
                                (typeof value === 'object' && value && value.length) ? jsTypeCastValue(value.join(), fieldJSType) : jsTypeCastValue(value, fieldJSType) :
                                jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);
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



class QueryBuilder extends Component {

  render() {
      /** @type {{condition: string, rules: {condition: *=, field: string=, operator: string=, value: *=}[]}} */
      const rules = this.props.rules;
      /** @type {boolean} */
      const disabled = this.props.disabled;
      /** @type {function(number[], {}, boolean): Component} */
      const makeItemComponent = this.props.makeItemComponent;
      /** @type {{onSwitch: (function(number[], boolean)), onAdd: (function(number[], boolean)), onDeleteGroup: (function(number[])), onDeleteItem: (function(number[], number))}} */
      const handlers = this.props.handlers;

      return (
          <div>
              <div className="query-builder">
                  <RulesGroupContainer
                      index={[]}
                      makeItemComponent={makeItemComponent}
                      ruleItems={rules.rules}
                      ruleIsAnd={rules.condition == 'AND'}
                      disabled={disabled}
                      handlers={handlers}
                  />
              </div>
          </div>
      );
  }
}

class RulesGroupContainer extends Component {

    render() {
        /** @type {number[]} */
        const index = this.props.index;
        /** @type {function(number[], {}, boolean): Component} */
        const makeItemComponent = this.props.makeItemComponent;
        /** @type {{condition: *=, field: string=, operator: string=, value: *=}[]} */
        const ruleItems = this.props.ruleItems;
        /** @type {boolean} */
        const ruleIsAnd = this.props.ruleIsAnd;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {{onSwitch: (function(number[], boolean)), onAdd: (function(number[], boolean)), onDeleteGroup: (function(number[])), onDeleteItem: (function(number[], number))}} */
        const handlers = this.props.handlers;

        return (
            <dl className="rules-group-container">
                <RulesGroupHeader
                    index={index}
                    disabled={disabled}
                    isAnd={ruleIsAnd}
                    onSwitch={ (isAnd) => { handlers.onSwitch(index, isAnd); }  }
                    onAdd={ (isGroup) => { handlers.onAdd(index, isGroup); } }
                    onDelete={ () => { handlers.onDeleteGroup(index); } }
                />
                <RulesGroupBody
                    index={index}
                    items={ruleItems}
                    disabled={disabled}
                    makeItemComponent={makeItemComponent}
                    handlers={handlers}
                />
            </dl>
        );
    }
}

class RulesGroupHeader extends Component {
    render() {
        /** @type {number[]} */
        const index = this.props.index;
        /** @type {boolean} */
        const isAnd = this.props.isAnd;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {function(boolean)} */
        const onSwitch = this.props.onSwitch;
        /** @type {function(boolean)} */
        const onAdd = this.props.onAdd;
        /** @type {?function()} */
        const onDelete = this.props.onDelete;

        const BUTTON_VALUES = { AND: 'AND', OR: 'OR' };

        function makeAddButton(caption, disabled, onAdd) {
            return (
                <button type="button" className="btn btn-xs btn-success" disabled={disabled} onClick={onAdd}>
                    <i className="glyphicon glyphicon-plus"/> {caption}
                </button>
            );
        }

        function makeRadioButton(caption, value, groupName, isOn, disabled, onSwitch) {

            function onChange(evt) {
                const isAnd = evt.target.value == BUTTON_VALUES.AND;
                onSwitch(isAnd);
            }

            return (
                <label className={"btn btn-xs btn-default " + (isOn ? 'active': '')}>
                    <input
                        type="radio"
                        name={groupName}
                        value={value}
                        disabled={disabled}
                        checked={isOn}
                        onChange={onChange} />
                    {caption}
                </label>
            );
        }

        var groupName = 'builder-basic-react_group_' + index.join('-') + '_cond';

        return (
            <dt className="rules-group-header">
                <div className="btn-group pull-right group-actions">
                    {makeAddButton('Add rule', disabled, () => { onAdd(false); })}
                    {makeAddButton('Add group', disabled, () => { onAdd(true); })}
                    {onDelete &&
                        <button type="button" className="btn btn-xs btn-danger" onClick={onDelete} disabled={disabled} >
                            <i className="glyphicon glyphicon-remove" /> Delete
                        </button>
                    }
                </div>
                <div className="btn-group group-conditions">
                    {makeRadioButton('AND', BUTTON_VALUES.AND, groupName, isAnd, disabled, onSwitch)}
                    {makeRadioButton('OR', BUTTON_VALUES.OR, groupName, !isAnd, disabled, onSwitch)}
                </div>
                <div className="error-container"><i className="glyphicon glyphicon-warning-sign" /></div>
            </dt>
        );
    }
}


class RulesGroupBody extends Component {

    render() {

        /** @type {number[]} */
        const index = this.props.index;
        /** @type {Object[]} */
        const items = this.props.items;
        /** @type {Component} */
        const makeItemComponent = this.props.makeItemComponent;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {{onSwitch: (function(number[], boolean)), onAdd: (function(number[], boolean)), onDeleteGroup: (function(number[])), onDeleteItem: (function(number[], number))}} */
        const handlers = this.props.handlers;


        function RuleContainer(props) {
            return (
                <li className="rule-container">
                    <div className="rule-header">
                        <div className="btn-group pull-right rule-actions">
                            {props.onDelete &&
                                <button
                                    type="button"
                                    className="btn btn-xs btn-danger"
                                    onClick={() => { props.onDelete() }}
                                    disabled={props.disabled}
                                >
                                    <i className="glyphicon glyphicon-remove"/> Delete
                                </button>
                            }
                        </div>
                    </div>
                    <div className="error-container"><i className="glyphicon glyphicon-warning-sign" /></div>
                    {props.makeItemComponent(props.index, props.item, props.disabled)}
                </li>
            );
        }

        return (
            <dd className="rules-group-body">
                <ul className="rules-list">
                    {
                        items.map( (item, itemIndex) => {
                            const indexNext = index.concat(itemIndex);
                            if (item.condition) {
                                return (
                                    <RulesGroupContainer
                                        index={indexNext}
                                        key={itemIndex}
                                        ruleItems={item.rules}
                                        ruleIsAnd={item.condition == 'AND'}
                                        disabled={disabled}
                                        makeItemComponent={makeItemComponent}
                                        handlers={handlers}
                                    />
                                );
                            } else {
                                return (
                                    <RuleContainer
                                        key={itemIndex}
                                        index={indexNext}
                                        item={item}
                                        disabled={disabled}
                                        makeItemComponent={makeItemComponent}
                                        onDelete={ () => handlers.onDeleteItem(index, itemIndex) }
                                    />
                                );
                            }
                        })
                    }
                </ul>
            </dd>
        );
    }
}


/**
 * Input field component with on blur and on enter firing onChange
 */
class Input extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value
        };
    }

    render() {
        const value = this.state.value;
        const onChange = this.props.onChange;

        return (
            <input
                {...this.props}
                value={value}
                onChange={ (evt) => this.setState({value: evt.target.value}) }
                onBlur={ (evt) => onChange(evt.target.value) }
                onKeyDown={ (evt) => { if (evt.keyCode == 13) onChange(value) } }
            />
        );
    }
}

/**
 * Example:

class App extends Component {
  render() {
    return (
      <div>
        <Input
          className="i1"
          type="number"
          value={1234}
          onChange={ (val) => { console.log(val); } }
        />
      </div>
    );
  }
}

 */


/**
 * Input fields arrays, resizeable and fixed sized
 */

const makeKey = (function() {
    var key;
    return function() {
        key = (key + 1) || 0;
        return key;
    };
})();

class InputResizingArray extends Component {

    static toKeyed(vals) {
        return vals.map( (v) => ({val: v, key: makeKey()}) );
    }

    static addEmpty(vals) {
        return vals.concat([{val: '', key: makeKey()}]);
    }

    static fromKeyed(vals) {
        return vals.map( (v) => v.val );
    }

    static removeEmpty(vals) {
        return vals.filter( (v) => v.val !== '' );
    }

    static DefaultInput(props) {
        return (
            <Input {...props} />
        );
    }

    constructor(props) {
        super(props);
        this.state = {
            value: InputResizingArray.addEmpty(InputResizingArray.toKeyed(props.value))
        };
    }

    render() {
        const InputComponent = this.props.InputComponent || InputResizingArray.DefaultInput;

        const self = this;

        function onEditIndex(val, index) {
            var arr = self.state.value.slice();
            const isValEmpty = val === '';
            const isIndexTail = index >= self.state.value.length - 1;
            arr[index].val = val;
            if (isValEmpty) {
            		if (!isIndexTail) {
                		arr.splice(index, 1);
                }
            } else {
                if (isIndexTail) {
                    arr = InputResizingArray.addEmpty(arr);
                }
            }
            self.setState({value: arr});
            self.props.onChange(InputResizingArray.fromKeyed(InputResizingArray.removeEmpty(arr)));
        }

        return (
            <div>
                {this.state.value.map( (val, i) => {
                    return (
                        <InputComponent key={val.key} {...this.props} value={val.val} onChange={ (val) => onEditIndex(val, i) } />
                    );
                })}
            </div>
        );
    }
}

class InputArray extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: InputResizingArray.toKeyed(props.value)
        };
    }

    render() {
        const InputComponent = this.props.InputComponent || InputResizingArray.DefaultInput;

        const self = this;

        function onEditIndex(val, index) {
            var arr = self.state.value.slice();
            arr[index].val = val;
            self.setState({value: arr});
            self.props.onChange(InputResizingArray.fromKeyed(arr));
        }

        return (
            <div>
                {this.state.value.map( (val, i) => {
                    return (
                        <InputComponent key={val.key} {...this.props} value={val.val} onChange={(val) => onEditIndex(val, i)} />
                    );
                })}
            </div>
        );
    }
}


class FieldFilterItem extends Component {

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

        const selectOptionsList = fields.map( (field) => { return {value: field.id, label: field.label} } );
        const selectOptionValue = item.field;

        const opsListForSelect = allowedOpsTypes.map( (opname) => { return {value: opname, label: opsUtils.genomicsRuleOperatorsLabels[opname]}; });

        return (
            <div>
                <div className="rule-filter-container">
                    <Select
                        className="selectTree"
                        options={selectOptionsList}
                        value={selectOptionValue}
                        clearable={false}
                        disabled={disabled}
                        onChange={(val) => {
                            onChange({
                                id: val.value,
                                field: val.value,
                                operator: item.operator,
                                value: item.value
                            });
                        }}
                    />
                </div>
                <div className="rule-operator-container rule-operator-container-operation">
                    <Select
                        className="select2"
                        options={opsListForSelect}
                        value={item.operator}
                        clearable={false}
                        disabled={disabled}
                        onChange={ (val) => {
                            onChange({
                                id: item.id,
                                field: item.field,
                                operator: val.value,
                                value: item.value
                            });
                        }}
                    />
                </div>
                <div className="rule-value-container">
                    {(function(value){

                        const getInputValue = valueType === 'number' ? (v) => +v : (v) => v;
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
                            return (
                                <div className="rule-value-array">
                                    <InputArrayComponent
                                        value={value}
                                        type={valueType === 'number' ? 'number' : 'text'}
                                        disabled={disabled}
                                        InputComponent={ (props) => {
                                            return (
                                                <div key={index} className="rule-value-array-item">
                                                    <Input {...props} className="form-control" />
                                                </div>
                                            );
                                        }}
                                        onChange={ (vals) => onChange({
                                            id: item.id,
                                            field: item.field,
                                            operator: item.operator,
                                            value: getInputValueArray(vals)
                                        })}
                                    />
                                </div>
                            );
                        }
                        if (typeof value === 'boolean') {
                            return (
                                <input
                                    className="form-control"
                                    type="checkbox"
                                    checked={item.value}
                                    disabled={disabled}
                                    onChange={ (evt) => onChange({
                                        id: item.id,
                                        field: item.field,
                                        operator: item.operator,
                                        value: evt.target.checked
                                    })}
                                />
                            );
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

    /**
     * Make field structure usable for filters dialog purpposes
     * @param {{id: string, label: string, sourceName: string, valueType: string}} f
     * @param {string=} sourceName
     * @returns {{id: string, label: string, type: string}}
     */
    static getFieldValue(f, sourceName) {
        return {
            id: f.id,
            label: `${f.label} -- ${(sourceName == null ? f.sourceName : sourceName)}`,
            type: f.valueType === 'float' ? 'double' : f.valueType
        };
    }

    /**
     * Make fields array for filters
     * @param {{notEditableFields: Object[], sourceFieldsList: Object[]}} fields
     * @returns {{id: string, label: string, type: string}[]}
     */
    static makeFieldsList(fields) {

        /*
         There was two arrays:

         at componentDidMount:
         ...fields.notEditableFields.map( (f) => { return {id: f.id, label: `${f.name} -- ${f.sourceName}`, type: f.valueType === 'float' ? 'double' : f.valueType} } ),
         ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map( (f) => { return {id: f.id, label: `${f.name} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType }} )

         at componentWillUpdate:
         ...fields.sampleFieldsList.map( (f) => { return {id: f.id, label: `${f.label} -- ${f.sourceName}`, type: f.valueType === 'float' ? 'double' : f.valueType} } ),
         ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map( (f) => { return {id: f.id, label: `${f.label} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType }} )

         1st part is from 'notEditableFields' at 'componentDidMount' vs 'sampleFieldsList' at 'componentWillUpdate'
         and all '.name' at componentDidMount vs '.label' at 'componentWillUpdate'

         There must be not editable fields to prevent select gender for the person
         */

        return [
            ...fields.notEditableFields.map( (f) => FilterBuilder.getFieldValue(f) ),
            ...fields.sourceFieldsList.filter( (f) => (f.sourceName !== 'sample') ).map( (f) => FilterBuilder.getFieldValue(f, 'source') )
        ];
    }

    render() {
        const {editOrNew, editedFilter, newFilter} = this.props.filterBuilder;
        const filter = editOrNew ? editedFilter : newFilter;

        return (
            <div className="builder-wrapper">
                <FilterQueryBuilder
                    fields={FilterBuilder.makeFieldsList(this.props.fields)}
                    rules={filter.rules}
                    disabled={filter.type === 'standard' || filter.type === 'advanced'}
                    dispatch={this.props.dispatch}
                />
            </div>
        );
    }
}
