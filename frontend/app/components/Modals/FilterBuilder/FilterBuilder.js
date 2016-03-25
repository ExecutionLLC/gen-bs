import React, { Component } from 'react';

import filterOperators from './filterOperators'
import { filterBuilderReceiveRules, filterBuilderUpdateFilter, filterBuilderCreateFilter } from '../../../actions/filterBuilder';


export default class FilterBuilder extends Component {

  componentDidMount() {
    const { fields } = this.props;
    const { editOrNew, editedFilter, newFilter } = this.props.filterBuilder;
    const filter = editOrNew ? (editedFilter):(newFilter);
    var el = this.refs.builder;

    const builderFilters = [

        ...fields.list.map( (f) => { return {id: f.id, label: `${f.name} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
        ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.name} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

      ];

    window.$(el).queryBuilder({
      filters: builderFilters,
      operators: filterOperators
    });
    this.disableFilter(filter,el);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.fields !== nextProps.fields
      || this.props.filterBuilder !== nextProps.filterBuilder;
  }

  disableFilter(filter,el) {
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
  }

  componentWillUpdate(nextProps) {
    const { dispatch, fields } = nextProps;
    const { editOrNew, rulesRequested, editedFilter, newFilter } = nextProps.filterBuilder;
    const filter = editOrNew ? (editedFilter):(newFilter);
    var el = this.refs.builder;
    var rules = [];
    const builderFilters = [

        ...fields.list.map( (f) => { return {id: f.id, label: `${f.label} -- ${f.source_name}`, type: f.value_type === 'float' ? 'double' : f.value_type} } ),
        ...fields.sourceFieldsList.filter((f) => (f.source_name !== 'sample')).map( (f) => { return {id: f.id, label: `${f.label} -- source`, type: f.value_type === 'float' ? 'double' : f.value_type }} )

      ];

    if(rulesRequested) {
      rules = window.$(el).queryBuilder('getGenomics');
      console.log('rules',JSON.stringify(rules));
      dispatch(filterBuilderReceiveRules(rules))
    } else {
      window.$(el).queryBuilder({
        filters: builderFilters,
        operators: filterOperators
      });
      this.disableFilter(filter,el);
    }
  }

  render() {

    return (
      <div className="builder-wrapper">
        <div id="builder-basic" className="query-builder form-inline" ref="builder"></div>
      </div>
    );
  }
}
