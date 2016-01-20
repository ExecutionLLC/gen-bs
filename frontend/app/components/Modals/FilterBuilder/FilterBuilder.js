import React, { Component } from 'react';

import { filterBuilderReceiveRules } from '../../../actions/filterBuilder';


export default class FilterBuilder extends Component {

  componentDidMount() {

    const { dispatch, fields } = this.props
    const { editOrNew, rulesPrepared, editedFilter, newFilter } = this.props.filterBuilder
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
    const { rulesPrepared } = nextProps.filterBuilder
    var el = this.refs.builder
    var rules = []
    if(rulesPrepared) {
      rules = window.$(el).queryBuilder('getMongo');
      console.log('result: ', rules)
      dispatch(filterBuilderReceiveRules(rules))
    }
  }

  render() {

    return (
      <div className="builder-wrapper">
        <div id="builder-basic" className="query-builder form-inline" ref="builder"></div>
        <button
          className="btn btn-success"
          onClick={ () => {
            var el = this.refs.builder
            var result = window.$(el).queryBuilder('getMongo');
            console.log('result: ', result)
          }}
          >
          Export
        </button>
      </div>
    );
  }
}
