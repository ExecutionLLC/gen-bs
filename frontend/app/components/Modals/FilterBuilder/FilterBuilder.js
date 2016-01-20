import React, { Component } from 'react';

import { filterBuilderReceiveRules, filterBuilderUpdateFilter, filterBuilderCreateFilter } from '../../../actions/filterBuilder';


export default class FilterBuilder extends Component {

  componentDidMount() {

    const { dispatch, fields } = this.props
    const { editOrNew, rulesRequested, editedFilter, newFilter } = this.props.filterBuilder
    const filter = editOrNew ? (editedFilter):(newFilter)
    var el = this.refs.builder
    var rules = []

    const builderFilters = fields.list.map( (f) => {
      return {
        id: f.name,
        label: f.name,
        type: f.value_type === 'float' ? 'double' : f.value_type
      }
    })
    console.log('didMount curr builderFilter in Builder', builderFilters)

    window.$(el).queryBuilder({
      filters: builderFilters
    })
    window.$(el).queryBuilder('setRulesFromMongo', filter.rules);


  }

  componentWillUpdate(nextProps) {
    console.log(nextProps)
    const { dispatch } = nextProps
    const { editOrNew, rulesRequested, rulesPrepared, editedFilter, newFilter } = nextProps.filterBuilder
    var el = this.refs.builder
    var rules = []
    if(rulesRequested) {
      rules = window.$(el).queryBuilder('getMongo');
      console.log('result: ', rules)
      dispatch(filterBuilderReceiveRules(rules))
    }
    //if(rulesPrepared) {
    //  editOrNew ? dispatch(filterBuilderUpdateFilter()) : dispatch(filterBuilderCreateFilter())
    //}
  }

  render() {

    return (
      <div className="builder-wrapper">
        <div id="builder-basic" className="query-builder form-inline" ref="builder"></div>
      </div>
    );
  }
}
