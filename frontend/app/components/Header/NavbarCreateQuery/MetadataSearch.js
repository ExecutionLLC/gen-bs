import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class MetadataSearch extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const samples = this.props.userData.samples
    return (

        <div className="table-cell table-cell100">
            <div className="btn-group" data-localize="samples.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Click here and type to search field symbols containing in metadata of available samples">
              <Select2
               className="sample-search"
               multiple={false}
               data={samples.map( s => { return {id: s.id, text: s.file_name} } )}
               options={{
                 placeholder: 'search by sample',
               }} 
               onSelect={(e) => { this.props.sampleSelected(e) } }
               />
            </div>
        </div>

    )
  }
}
