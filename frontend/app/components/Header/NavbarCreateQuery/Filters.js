import React, { Component } from 'react';
import Select from 'react-select';

import { changeView } from '../../../actions/ui'

export default class Filters extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const filters = this.props.userData.filters
    const dispatch = this.props.dispatch
    const currentFilter = this.props.ui.currentFilter

    return (

     <div className="table-cell table-cell100">
          <div className="btn-group"  data-localize="filters.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available filters">

            <Select
              options={filters.map( f => { return {value: f.id, label: f.name} } )}
              value={currentFilter ? currentFilter.id: null}
              clearable={false}
              onChange={ (val) => dispatch(changeFilter(val.value) )}
            />

          </div>
      </div>


    )
  }
}
