import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';

export default class FileUploadSamplesRow extends Component {
  constructor(...args) {
    super(...args);
    this.state = { showValues: false };
  }

  clickShowValues(e) {
    e.preventDefault();
    this.setState({showValues: !this.state.showValues});
  }


  render() {
    return (
      <div>
        {this.renderMain()}
        {this.renderValues()}
      </div>
    );
  }

  renderMain() {
    const { sample } = this.props;
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="btn-group pull-right">
            <a onClick={() => this.props.onSelectSample()} className="btn btn-default btn-choose" role="button">
              <span data-localize="samples.settings.select.title">Select for analysis</span>
            </a>
            {sample.type === 'user'
            && <a onClick={e => this.clickShowValues(e)}
                  className="btn btn-default collapsed" role="button"
                  data-toggle="collapse" data-parent="#accordion"
                  href="#collapseOne" aria-expanded="false"
                  aria-controls="collapseOne">
              <i className="fa fa-pencil"></i>
            </a>}
          </div>
          <div className="flex">
            <dl>
              <dt>Name</dt>
              <dd>{sample.file_name}</dd>
            </dl>
            <dl>
              <dt>Version</dt>
              <dd><i>unknown</i></dd>
            </dl>
            <dl>
              <dt>Type</dt>
              <dd>{sample.type}</dd>
            </dl>
            <dl>
              <dt>Description</dt>
              <dd><i>empty</i></dd>
            </dl>
          </div>
        </div>
      </div>
    );

  }

  renderValues() {
    const { sample } = this.props;
    const values = _.indexBy(sample.values, 'field_id');
    return (
      <Panel collapsible expanded={this.state.showValues} className="samples-values form-horizontal-rows">
        <div className="flex">
          {this.props.fields.map(field => {
            if (!values[field.id]) {
              console.error('unknown field', field.id)
            }
            return (
              <dl key={field.id}>
                <dt>{field.label}</dt>
                <dd>
                  <input
                    type="text"
                    className="form-control"
                    value={values[field.id] && values[field.id].values}
                    onChange={(e) => this.props.onUpdateSampleValue(field.id, e.target.value)}
                  />
                </dd>
              </dl>
            );
          })}
        </div>
      </Panel>
    )
  }
}