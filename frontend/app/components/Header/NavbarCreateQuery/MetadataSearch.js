import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class MetadataSearch extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const samples = this.props.userData.samples
    return (

        <div className="table-cell max-width">
            <div className="btn-group" data-localize="samples.help">
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
