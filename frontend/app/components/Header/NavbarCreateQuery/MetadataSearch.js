import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class MetadataSearch extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <div className="table-cell table-cell100">
            <div className="btn-group" data-localize="samples.help" data-toggle="tooltip" data-placement="bottom"  data-container="body" title="Click here and type to search field symbols containing in metadata of available samples">
              <Select2
               className="sample-search"
               multiple={true}
               data={['mental retardation patient12', 'feature', 'documents', 'discussion']}
               options={{
                 placeholder: 'search by sample',
               }} />
            </div>
        </div>

    )
  }
}
