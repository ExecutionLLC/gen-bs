import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Panel } from 'react-bootstrap';
import { changeSample, updateSampleValue, resetSamplesList, requestUpdateSampleFields} from '../../../actions/ui'
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
                    dispatch(initSamplesList(samples));
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
        const { sample, dispatch, samplesList } = this.props;
        const currentSampleIndex = _.findIndex(samplesList.Samples, {id: sample.id});
        const selectOptions = field.available_values.map(
            option => { return {value: option.id, label: option.value}}
        );

        let currentValueId = '';

        if (samplesList.Samples[currentSampleIndex].fields) {
            currentValueId= samplesList.Samples[currentSampleIndex].fields[field.id];

        return (
            <dl key={field.id} className="dl-horizontal">
            <dt>{field.label}</dt>
            <dd>
            <Select
                options={selectOptions}
                clearable={false}
                value={currentValueId}
                onChange={(e) => dispatch(updateSampleValue(sample.id, field.id, e.value))}
            />
            </dd>
            </dl>
        );
    }

    renderTextField(values, field) {
        const { sample, dispatch, samplesList } = this.props;
        const currentSampleIndex = _.findIndex(samplesList.Samples, {id: sample.id});
        let currentValue;
        if (samplesList.Samples[currentSampleIndex].fields) {
            currentValue = samplesList.Samples[currentSampleIndex].fields[field.id];
        } else {
            currentValue = '';
        }
        return (
            <dl key={field.id} className="dl-horizontal">
            <dt>{field.label}</dt>
            <dd>
            <input
                type="text"
                className="form-control"
                value={currentValue}
                onChange={(e) => dispatch(updateSampleValue(sample.id, field.id, e.target.value)) }
            />
            </dd>
            </dl>
        );
    }

    renderRowButtons() {
        const { sample, dispatch } = this.props;
        return (
            <div className="btn-group ">
                <button
                    onClick={ () => dispatch(resetSamplesList(sample.id)) }
                    type="button"
                    className="btn btn-default"
                >
                    <span data-localize="actions.save_select.title">Cancel</span>
                </button>

                <button
                    onClick={ () => dispatch(requestUpdateSampleFields(sample.id, this.props.fields)) }
                    type="button"
                    className="btn btn-primary"
                >
                    <span data-localize="actions.save_select.title">Save</span>
                </button>
            </div>
        )
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
                  {this.renderRowButtons()}
                </div>
                </Panel>
            )
    }
}

function mapStateToProps(state) {
    const { ui, samplesList } = state;
    return {
        ui,
        samplesList
    }
}

export default connect(mapStateToProps)(FileUploadSamplesRow)