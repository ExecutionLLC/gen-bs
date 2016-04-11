import React, { Component } from 'react';
import Select from 'react-select';

import filterOperators from './filterOperators'
import { filterBuilderReceiveRules, filterBuilderChangeAll } from '../../../actions/filterBuilder';

import filterUtils from '../../../utils/filterUtils';

/**
 * @template {T}
 * @param {Object.<string, T>} o
 * @returns {{key: string, val: T}|null}
 */
function getOnlyProperty(o) {
    var property;
    var hasMore = _.some(o, (val, key) => {
        if (property) {
            property = null;
            return true;
        }
        property = {
            key: key,
            val: val
        };
        return false;
    });
    if (!hasMore && property) {
        return property;
    } else {
        return null;
    }
}

function makeKeyMaker() {

    function next(arr) {
        const index = arr.length - 1;
        arr[index]++;
    }

    function makeSubKey(prevArr) {
        var arr = prevArr.concat(-1);
        function retNext() {
            next(arr);
            return arr.slice();
        }
        retNext.makeSubKeyMaker = function() {
            return makeSubKey(arr);
        };
        return retNext;
    }

    return makeSubKey([]);
}


const filterParser = {
    condition: {
        '$and': {isAnd: true},
        '$or': {isAnd: false}
    },
    /**
     * @param {string} id
     * @returns {{isAnd: boolean}|null}
     */
    getGroupIdCondition: function(id) {
        return this.condition[id]
    },
    /**
     * @param {Object} item
     * @returns {{group: {isAnd: boolean}, items: Array}|{id: string, item: Object}|null}
     */
    parseGroupRule: function(item) {
        const ruleOnly = getOnlyProperty(item);
        if (!ruleOnly) {
            return null;
        }
        const condition = this.getGroupIdCondition(ruleOnly.key);
        if (condition) {
            return {
                group: condition,
                items: ruleOnly.val
            };
        }
        return {
            id: ruleOnly.key,
            item: ruleOnly.val
        };
    },
    ops: {
        genomicsOperators: {
            equal:            function(v) { return { '$eq': v[0] }; },
            not_equal:        function(v) { return { '$neq': v[0] }; },
            in:               function(v) { return { '$in': v }; },
            not_in:           function(v) { return { '$nin': v }; },
            less:             function(v) { return { '$lt': v[0] }; },
            less_or_equal:    function(v) { return { '$lte': v[0] }; },
            greater:          function(v) { return { '$gt': v[0] }; },
            greater_or_equal: function(v) { return { '$gte': v[0] }; },
            between:          function(v) { return { '$between': v }; },
            not_between:      function(v) { return { '$nbetween': v }; },
            begins_with:      function(v) { return { '$begin_with': v[0] }; },
            not_begins_with:  function(v) { return { '$nbegin_with': v[0] }; },
            contains:         function(v) { return { '$contains': v[0] }; },
            not_contains:     function(v) { return { '$ncontains': v[0] }; },
            ends_with:        function(v) { return { '$end_with': v[0] }; },
            not_ends_with:    function(v) { return { '$nend_with': v[0] }; },
            is_empty:         function(v) { return { '$eq': '' }; },
            is_not_empty:     function(v) { return { '$neq': '' }; },
            is_null:          function(v) { return { '$eq': null }; },
            is_not_null:      function(v) { return { '$neq': null }; }
        },
        genomicsRuleOperators: {
            $eq: function(v) {
                v = v.$eq;
                return {
                    'val': v,
                    'op': v === null ? 'is_null' : (v === '' ? 'is_empty' : 'equal')
                };
            },
            $neq: function(v) {
                v = v.$neq;
                return {
                    'val': v,
                    'op': v === null ? 'is_not_null' : (v === '' ? 'is_not_empty' : 'not_equal')
                };
            },
            $in: function(v) { return { 'val': v.$in, 'op': 'in' }; },
            $nin: function(v) { return { 'val': v.$nin, 'op': 'not_in' }; },
            $lt: function(v) { return { 'val': v.$lt, 'op': 'less' }; },
            $lte: function(v) { return { 'val': v.$lte, 'op': 'less_or_equal' }; },
            $gt: function(v) { return { 'val': v.$gt, 'op': 'greater' }; },
            $gte: function(v) { return { 'val': v.$gte, 'op': 'greater_or_equal' }; },
            $begin_with: function(v) { return { 'val': v.$begin_with, 'op': 'begins_with' }; },
            $nbegin_with: function(v) { return { 'val': v.$nbegin_with, 'op': 'not_begins_with' }; },
            $contains: function(v) { return { 'val': v.$contains, 'op': 'contains' }; },
            $ncontains: function(v) { return { 'val': v.$ncontains, 'op': 'not_contains' }; },
            $between: function(v) { return { 'val': v.$between, 'op': 'between' }; },
            $nbetween: function(v) { return { 'val': v.$nbetween, 'op': 'not_between' }; },
            $end_with: function(v) { return { 'val': v.$end_with, 'op': 'ends_with' }; },
            $nend_with: function(v) { return { 'val': v.$nend_with, 'op': 'not_ends_with' }; }
        },
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
            "is_empty": "is empty",
            "is_not_empty": "is not empty",
            "is_null": "is null",
            "is_not_null": "is not null"
        },
        genomicsRulesOperatorsList: filterOperators
    }
};
















/**

FilterQueryBuilder(
     fields: {}
     rules: {{ <'$and'|'$or'>: ({id, label, type}|rules)[] }}
     rules1: {{condition: <'AND'|'OR'>, rules: ({field, id, operator, value}|{condition})[]}}
     disabled: boolean
)
    QueryBuilder(
        rules: {{ <'$and'|'$or'>: ({id, label, type}|rules)[] }}
        rules1: {{condition: <'AND'|'OR'>, rules: ({field, id, operator, value}|{condition})[]}}
        disabled: boolean
        makeItemComponent: function
        handlers: {}
    )
        RulesGroupContainer(
            index: number[] // [] - root, [1, 2] - 2nd child at 1st child of root
            makeItemComponent: function
            ruleIsAnd: boolean
            ruleItems: []
            disabled: boolean
            handlers: {}
        )
            RulesGroupHeader(
                index: number[] // [] - root, [1, 2] - 2nd child at 1st child of root
                disabled: boolean
                isAnd: boolean
                onSwitch: function(boolean)
                onAdd: function(boolean)
                onDelete: ?function()
            )
            RulesGroupBody(
                index: number[] // [] - root, [1, 2] - 2nd child at 1st child of root
                items: Object[]
                disabled: boolean
                makeItemComponent: Component
                handlers: {}
            )
                RulesGroupContainer(...)
                itemComponent(...)

 */


class FilterQueryBuilder extends Component {
    render() {
        const fields = this.props.fields;
        const rules = this.props.rules;
        const disabled = this.props.disabled;
        const dispatch = this.props.dispatch;

        const parsedRules = filterUtils.getRulesFromGenomics(rules);

        const fieldDefault = fields[Object.keys(fields)[0]].id;

        const handlers = {
            onSwitch(index, isAnd) {

                var searchIndex = index.slice();
                var subrules = parsedRules;
                var indexNow;
                while (searchIndex.length) {
                    subrules = subrules.rules;
                    indexNow = searchIndex.shift();
                    subrules = subrules[indexNow];
                }
                subrules.condition = isAnd ? 'AND' : 'OR';

                dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
            },
            onAdd(index, isGroup) {
                var searchIndex = index.slice();
                var subrules = parsedRules;
                var indexNow = null;
                while (searchIndex.length) {
                    subrules = subrules.rules;
                    indexNow = searchIndex.shift();
                    subrules = subrules[indexNow];
                }
                if (isGroup) {
                    subrules.rules.push({condition: 'AND', rules: [{id: fieldDefault, field: fieldDefault, operator: 'is_null', value: null}]});
                } else {
                    subrules.rules.push({id: fieldDefault, field: fieldDefault, operator: 'is_null', value: null});
                }
                dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
            },
            onDeleteGroup(index) {
                var searchIndex = index.slice();
                var subrules = parsedRules;
                var indexNow = null;
                while (searchIndex.length) {
                    subrules = subrules.rules;
                    indexNow = searchIndex.shift();
                    if (searchIndex.length) {
                        subrules = subrules[indexNow];
                    }
                }
                if (indexNow != null) {
                    subrules.splice(indexNow, 1);
                    dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                }
            },
            onDeleteItem(index, itemIndex) {
                var searchIndex = index.slice();
                var subrules = parsedRules;
                var indexNow = null;
                while (searchIndex.length) {
                    subrules = subrules.rules;
                    indexNow = searchIndex.shift();
                    subrules = subrules[indexNow];
                }
                if (subrules.rules.length > 1) {
                    subrules.rules.splice(itemIndex, 1);
                    dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                }
            }
        };

        function makeFilterItem(index, item, disabled) {

            return (
                <FieldFilterItem
                    index={index}
                    item={item}
                    fields={fields}
                    disabled={disabled}
                    onChange={ (item) => {

                        var searchIndex = index.slice();
                        var subrules = parsedRules;
                        var indexNow;
                        while (searchIndex.length) {
                            subrules = subrules.rules;
                            indexNow = searchIndex.shift();
                            if (searchIndex.length) {
                               subrules = subrules[indexNow];
                            }
                        }

                        subrules[indexNow] = item;
                        dispatch(filterBuilderChangeAll(filterUtils.getGenomics(parsedRules)));
                    }}
                />
            );
        }

        return <QueryBuilder
            rules={parsedRules}
            disabled={disabled}
            makeItemComponent={makeFilterItem}
            handlers={handlers}
        />
    }
}



class QueryBuilder extends Component {

  render() {
      /** @type {{condition: string, rules: Object[]}} */
      const rules = this.props.rules;
      /** @type {boolean} */
      const disabled = this.props.disabled;
      /** @type function(Object):Component */
      const makeItemComponent = this.props.makeItemComponent;
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
        /** @type {function(Object):Component} */
        const makeItemComponent = this.props.makeItemComponent;
        /** @type {Object[]} */
        const ruleItems = this.props.ruleItems;
        /** @type {boolean} */
        const ruleIsAnd = this.props.ruleIsAnd;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {{onSwitch: function(boolean), onAdd: function(boolean), onDeleteGroup: function(), onDeleteItem: function(number)}} */
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
                    {props.makeItemComponent(props.indexNext, props.item, props.disabled)}
                </li>
            );
        }


        function makeRuleContainer(indexNext, key, item, disabled, makeItemComponent, onDelete) {
            return (
                <li className="rule-container" key={key}>
                    <div className="rule-header">
                        <div className="btn-group pull-right rule-actions">
                            {onDelete &&
                            <button
                                type="button"
                                className="btn btn-xs btn-danger"
                                onClick={() => { onDelete() }}
                                disabled={disabled}
                            >
                                <i className="glyphicon glyphicon-remove"/> Delete
                            </button>
                            }
                        </div>
                    </div>
                    <div className="error-container"><i className="glyphicon glyphicon-warning-sign" /></div>
                    {makeItemComponent(indexNext, item, disabled)}
                </li>
            );
        }

        function makeGroupContainer(index1, key, parsedRule, disabled, makeItemComponent) {
            return (
                <RulesGroupContainer
                    index={index1}
                    key={key}
                    ruleItems={parsedRule.items}
                    ruleIsAnd={parsedRule.group.isAnd}
                    disabled={disabled}
                    makeItemComponent={makeItemComponent}
                    handlers={handlers}
                />
            );
        }

        return (
            <dd className="rules-group-body">
                <ul className="rules-list">
                    {
                        items.map( (item, itemIndex) => {
                            const indexNext = index.concat(itemIndex);
                            if (item.condition) {
                                //return <h1>{item.condition}</h1>
                                return <RulesGroupContainer
                                    index={indexNext}
                                    key={itemIndex}
                                    ruleItems={item.rules}
                                    ruleIsAnd={item.condition == 'AND'}
                                    disabled={disabled}
                                    makeItemComponent={makeItemComponent}
                                    handlers={handlers}
                                />
                            } else {
                                return <RuleContainer
                                    key={itemIndex}
                                    indexNext={indexNext}
                                    item={item}
                                    disabled={disabled}
                                    makeItemComponent={makeItemComponent}
                                    onDelete={ () => handlers.onDeleteItem(index, itemIndex) }
                                />
                            }
                        })
                    }
                </ul>
            </dd>
        );
    }
}



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



class FieldFilterItem extends Component {
    render() {
        //return <span>{JSON.stringify(this.props.item)}</span>
        /** {number[]} */
        const index = this.props.index;
        /** @type {{fieldId: string, fieldCondition: Object.<string, string|number|boolean|null|Array.<string|number>>}} */
        const item = this.props.item;
        /** @type {Array.<{id: string, label: string, type: string}>} */
        const fields = this.props.fields;
        /** @type {boolean} */
        const disabled = this.props.disabled;
        /** @type {function({fieldId: string, fieldCondition: Object.<string, string|number|boolean|null|Array.<string|number>>})} */
        const onChange = this.props.onChange;

        const selectOptionsList = fields.map( (field) => { return {value: field.id, label: field.label} } );
        const selectOptionValue = item.field;

        const opsListForSelect = filterParser.ops.genomicsRulesOperatorsList.map( (opname) => { return {value: opname, label: filterParser.ops.genomicsRuleOperatorsLabels[opname]}; });

        function makeInputForSingleValue(value, disabled, onChange) {
            var inputInfo = {
                    'number': {attributes: {type: 'number', value: value}, getValue(el) { return +el.value; }, isText: true},
                    'boolean': {attributes: {type: 'checkbox', checked: !!value}, getValue(el) { return el.checked; }, isText: false}
                }[typeof value] || {attributes: {type: 'text', value: value}, getValue(el) { return el.value; }, isText: true };
            return (
                inputInfo.isText ?
                    <Input
                        className="form-control"
                        {...inputInfo.attributes}
                        disabled={disabled}
                        onChange={ (val) => onChange(val) }
                    /> :
                    <input
                        className="form-control"
                        {...inputInfo.attributes}
                        disabled={disabled}
                        onChange={ (evt) => onChange(inputInfo.getValue(evt.target)) }
                    />
            );
        }

        function makeInputList(values, disabled, onChange) {
            return (
                <div className="rule-value-array">
                    {values.map( (value, index) => {
                        return (
                            <div key={index} className="rule-value-array-item">
                                {makeInputForSingleValue(value, disabled, (val) => onChange(index, val) )}
                            </div>
                        );
                    })}
                </div>
            );
        }

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
                    {
                        typeof item.value === 'object' ?
                            item.value && item.value.length ?
                                makeInputList(item.value, disabled, (i, val) => {
                                    var values = prop.item.value.slice();
                                    values[i] = val;
                                    onChange({
                                        id: item.id,
                                        field: item.field,
                                        operator: item.operator,
                                        value: values
                                    });
                                })
                                :
                                makeInputList([])
                            :
                            makeInputForSingleValue(item.value, disabled, (val) => {
                                onChange({
                                    id: item.id,
                                    field: item.field,
                                    operator: item.operator,
                                    value: val
                                });
                            })
                    }
                </div>
            </div>
        )
    }
}


class NullFilterItem extends Component {
    render() {
        return <div>item</div>
    }
}


export default class FilterBuilder extends Component {

  componentDidMount() {
    const { fields } = this.props;
    const { editOrNew, editedFilter, newFilter } = this.props.filterBuilder;
    const filter = editOrNew ? (editedFilter):(newFilter);
    var el = this.refs.builder;

    const builderFilters = this.makeFieldsList(fields);/*[

        ...fields.notEditableFields.map( (f) => { return {id: f.id, label: `${f.name} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
        ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.name} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

      ];*/
    window.$(el).queryBuilder({
      filters: builderFilters,
      operators: filterOperators
    });
    this.setFilterInfo(filter, el);
    this.disableFilter(filter,el);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.fields !== nextProps.fields
      || this.props.filterBuilder !== nextProps.filterBuilder;
  }

  setFilterInfo(filter,el) {
    window.$(el).queryBuilder('setRulesFromGenomics', filter.rules);
  }

  disableFilter(filter,el) {
/*
    window.$(el).queryBuilder('setRulesFromGenomics', filter.rules);
    if (filter.type === 'standard' || filter.type == 'advanced') {
      //inputs and selects
      window.$('input[name*="builder-basic_rule"],select[name*="builder-basic_rule"]')
          .prop('disabled', true);
      //and, or operators
      window.$('div[class*="group-conditions"]')
          .children()
          .children()
          .prop('disabled', true);
      //add rule ,add group
      window.$('div[class*="group-actions"]')
          .children()
          .prop('disabled', true);
      window.$('div[class*="rule-actions"]')
          .children()
          .prop('disabled', true);
    }
*/
  }

  makeFieldsList(fields) {

/*
There was two arrays:

at componentDidMount:
  ...fields.notEditableFields.map( (f) => { return {id: f.id, label: `${f.name} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
  ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.name} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

at componentWillUpdate:
 ...fields.sampleFieldsList.map( (f) => { return {id: f.id, label: `${f.label} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
 ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.label} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

1st part is from 'notEditableFields' at 'componentDidMount' vs 'sampleFieldsList' at 'componentWillUpdate'
and all '.name' at componentDidMount vs '.label' at 'componentWillUpdate'

There must be not editable fields to prevent select gender for the person
*/

    function getFieldValue(f, sourceName) {
      return {
        id: f.id,
        label: `${f.label} -- ${(sourceName == null ? f.source_name : sourceName)} (${f.value_type})`,
        type: f.value_type === 'float' ? 'double' : f.value_type
      };
    }

    return [
      ...fields.notEditableFields.map( (f) => getFieldValue(f) ),
      ...fields.sourceFieldsList.filter( (f) => (f.source_name !== 'sample') ).map( (f) => getFieldValue(f, 'source') )
    ];
  }

  componentWillUpdate(nextProps) {
    const { dispatch, fields } = nextProps;
    const { editOrNew, rulesRequested, editedFilter, newFilter } = nextProps.filterBuilder;
    const filter = editOrNew ? (editedFilter):(newFilter);
    var el = this.refs.builder;
    var rules = [];
    const builderFilters = this.makeFieldsList(fields);/*[

        ...fields.sampleFieldsList.map( (f) => { return {id: f.id, label: `${f.label} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
        ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.label} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

      ];*/

    if(rulesRequested) {
      rules = window.$(el).queryBuilder('getGenomics');
      dispatch(filterBuilderReceiveRules(rules))
    } else {
      window.$(el).queryBuilder({
        filters: builderFilters,
        operators: filterOperators
      });
      this.setFilterInfo(filter, el);
      this.disableFilter(filter,el);
    }
  }

  render() {
    const { editOrNew, rulesRequested, editedFilter, newFilter } = this.props.filterBuilder;
    const filter = editOrNew ? (editedFilter):(newFilter);
    return (
      <div className="builder-wrapper">
          <div>{filter.type || 'no type' + typeof filter.type + '   ' + JSON.stringify(filter)}</div>
        <div id="builder-basic" className="query-builder form-inline" ref="builder"></div>
        <FilterQueryBuilder
            fields={this.makeFieldsList(this.props.fields)}
            rules={filter.rules}
            disabled={filter.type === 'standard' || filter.type == 'advanced'}
            dispatch={this.props.dispatch}
        />
      </div>
    );
  }
}
