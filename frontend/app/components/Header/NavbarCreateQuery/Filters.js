import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class Filters extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const filters = this.props.userData.filters

    return (

     <div className="table-cell table-cell100">
          <div className="btn-group"  data-localize="filters.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available filters">
              <Select2
                 multiple={false}
                 data={filters.map( f => { return {id: f.id, text: f.name} } )}
                 options={{
                   placeholder: 'Default Filter',
                 }} 
                 onSelect={(e) => { this.props.filterSelected(e) } }
              />
          </div>
      </div>


    )
  }
}
