import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class Filters extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

     <div className="table-cell table-cell100">
          <div className="btn-group"  data-localize="filters.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Select one or more from available filters">
              <Select2
               multiple={true}
               data={['Eye Cancer Diagnostics', 'Breast cancer', 'Lung cancer', 'Autism', 'Retinoblastoma', 'Mental retardation']}
               options={{
                 placeholder: 'Eye Cancer Diagnostics',
               }} />
          </div>
      </div>


    )
  }
}
