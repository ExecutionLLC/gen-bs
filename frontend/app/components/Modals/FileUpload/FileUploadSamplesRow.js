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
            <div>
                {this.renderMain()}
                {this.renderValues()}
            </div>
        );
    }

    renderMain() {
        const { sample,samples,dispatch,closeModal } = this.props;
        return (
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="btn-group pull-right">

                <button
                    onClick={() => {
                      dispatch(changeSample(samples, sample.id));
                      closeModal('upload');
                    }}
                    className="btn btn-default btn-choose"
                    type="button" >
                  <span data-localize="samples.settings.select.title">Select for analysis</span>
                </button>
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

    renderSelectField(field) {

        const selectOptions = field.available_values.map(
            option => { return {value: option.id, label: option.value}}
        );

        const options = [
	        { value: 'one', label: 'One' },
	        { value: 'two', label: 'Two' }
        ];

        console.log('selectOptions =', selectOptions);
        return (
            <dl key={field.id}>
            <dt>{field.label}</dt>
            <dd>
            <Select
                options={options}
                clearable={false}
                value="one"
                onChange={(e) => this.props.onUpdateSampleValue(field.id, e.target.value)}
            />
            </dd>
            </dl>
        );
    }

    renderTextField(values, field) {
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