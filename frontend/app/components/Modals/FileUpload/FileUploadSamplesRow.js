import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';
import { changeSample} from '../../../actions/ui'
import Select from 'react-select';
import 'react-select/dist/react-select.css';


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
            <div className="panel">
                {this.renderHeader()}
                {this.renderValues()}
                {this.renderFooter()}
            </div>
        );
    }

    renderHeader() {
        const { sample } = this.props;
        return (
          <div>
              <div className="panel-heading">
                  <h3 className="panel-title">{sample.file_name}<span>{sample.description}</span></h3>
              </div>
          </div>
        );

    }
    renderFooter() {
        const { sample,samples,dispatch,closeModal } = this.props;
        return (
            <div className="panel-footer">

              <a onClick={() => {
                    dispatch(changeSample(samples, sample.id));
                    closeModal('upload');
                  }}
                  className="btn btn-link btn-uppercase"
                  type="button" >
                <span data-localize="samples.settings.select.title">Select for analysis</span>
              </a>
              {sample.type === 'user'
              && <a onClick={e => this.clickShowValues(e)}
                    className="btn btn-link btn-uppercase" role="button"
                    data-toggle="collapse" data-parent="#accordion"
                    href="#collapseOne" aria-expanded="false"
                    aria-controls="collapseOne">Edit
              </a>}
            </div>
          );

    }
    renderSelectField(field) {

        const selectOptions = field.available_values.map(
            option => { return {value: option.id, label: option.value}}
        );

        return (
            <dl key={field.id} className="dl-horizontal">
            <dt>{field.label}</dt>
            <dd>
            <Select
                options={selectOptions}
                clearable={false}
                value="one"
                onChange={(e) => this.props.onUpdateSampleValue(field.id, e.value)}
            />
            </dd>
            </dl>
        );
    }

    renderTextField(values, field) {
        return (
            <dl key={field.id} className="dl-horizontal">
            <dt>{field.label}</dt>
            <dd>
            <input
                type="text"
                className="form-control"
                value={values[field.id] && values[field.id].values}
                onChange={(e) => this.props.onUpdateSampleValue(field.id, e.value)}
            />
            </dd>
            </dl>
        );
    }

    renderValues() {
        const { sample } = this.props;
        const values = _.indexBy(sample.values, 'field_id');
            return (
                <Panel collapsible expanded={this.state.showValues} className="samples-values form-horizontal-rows">
                <div className="flex">
                    {this.props.fields.map(field => {
                        if (field.available_values) {
                            return this.renderSelectField(field);
                        } else {
                            return this.renderTextField(values, field);
                        }

                  })}
                </div>
                </Panel>
            )
    }
}