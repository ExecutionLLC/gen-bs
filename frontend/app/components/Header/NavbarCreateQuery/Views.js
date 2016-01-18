import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { changeView } from '../../../actions/ui'

export default class Views extends Component {


  render() {
    const dispatch = this.props.dispatch
    const views = this.props.views
    const currentView = this.props.ui.currentView
    console.log('views props', this.props)
    return (

      <div className="table-cell table-cell100">
      <div className="btn-group btn-group-select100" data-localize="views.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available views">

        <Select
          options={views.map( v => { return {value: v.id, label: v.name} } )}
          value={currentView ? currentView.id: null}
          clearable={false}
          onChange={ (val) => dispatch(changeView(views, val.value) )}
        />

      </div>
       </div>


    )
  }
}
