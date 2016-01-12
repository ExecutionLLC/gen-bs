import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';

export default class Views extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    console.log('views props', this.props)
  }

  render() {
    const views = this.props.userData.views
    return (

       <div className="table-cell table-cell100">
      <div className="btn-group btn-group-select100" data-localize="views.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available views">

        <Select2
         multiple={false}
         data={views.map( v => v.name )}
         options={{
           placeholder: 'Default View',
         }} />

      </div>
       </div>


    )
  }
}
