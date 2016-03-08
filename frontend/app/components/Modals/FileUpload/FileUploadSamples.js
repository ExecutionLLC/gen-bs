import React, { Component } from 'react';

import FileUploadSamplesRow from './FileUploadSamplesRow';

export default class FileUploadSamples extends Component {
  render() {
    return (
      <div>
        <h4 data-localize="samples.search.label">Searh for available samples</h4>
        <div className="form-group has-feedback">
          <input type="text" className="form-control"/>
          <span className="form-control-feedback"><i className="fa fa-lg fa-search text-muted"/></span>
        </div>
        <div className="panel-group">
          {this.props.samples.map(
            sample => <FileUploadSamplesRow sample={sample} fields={this.props.fieldsList} key={sample.id}/>
          )}
        </div>
      </div>
    );
  }
}