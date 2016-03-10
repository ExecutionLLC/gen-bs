import React, { Component } from 'react';

import { changeSample, updateSampleValue } from '../../../actions/ui'

import FileUploadSamplesRow from './FileUploadSamplesRow';

export default class FileUploadSamples extends Component {
  constructor(...args) {
    super(...args);
    this.state = { searchWord: '' };
  }
  render() {
    let { samples } = this.props;
    if (this.state.searchWord.length > 0) {
      let searchWord = this.state.searchWord.toLowerCase();
      samples = samples.filter(el => ~el.file_name.toLocaleLowerCase().indexOf(searchWord));
    }
    return (
      <div>
        <h4 data-localize="samples.search.label">Search for available samples</h4>
        <div className="form-group has-feedback">
          <input type="text" onChange={e => this.setState({ searchWord: e.target.value })} className="form-control"/>
          <span className="form-control-feedback"><i className="fa fa-lg fa-search text-muted"/></span>
        </div>
        <div className="panel-group">
          {samples.map(
            sample => (
              <FileUploadSamplesRow
                sample={sample}
                fields={this.props.fieldsList}
                key={sample.id}
                onSelectSample={() => this.props.dispatch(changeSample(samples, sample.id))}
                onUpdateSampleValue={(valueFieldId, value) => this.props.dispatch(updateSampleValue(sample.id, valueFieldId, value))}
              />
            )
          )}
        </div>
      </div>
    );
  }
}