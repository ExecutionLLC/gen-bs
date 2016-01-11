import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';

export default class Views extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

       <div className="table-cell table-cell100">
      <div className="btn-group btn-group-select100" data-localize="views.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available views">

        <Select2
         multiple={false}
         data={['Default View', 'Default View Copy', 'User Custom View 1', 'User Custom View 2', 'User Custom View 3', '']}
         options={{
           placeholder: 'Default View',
         }} />

      </div>
       </div>


    )
  }
}
