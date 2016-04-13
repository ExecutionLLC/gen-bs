import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Panel} from 'react-bootstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import {
    changeSample, receiveSamplesList, updateSampleValue, resetSampleInList,
    requestUpdateSampleFields
} from '../../../actions/samplesList'


export default class FileUploadSamplesRow extends Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    onShowValuesClick(e) {
        e.preventDefault();
        this.setShowValuesState(!this.state.showValues);
    }

    onSelectForAnalyzisClick(e, sample) {
        e.preventDefault();
        const {dispatch, closeModal, samplesList: {samples}} = this.props;
        dispatch(receiveSamplesList(samples));
        dispatch(changeSample(sample.id));
        closeModal('upload');
    }

    onSampleValueUpdated(sampleId, fieldId, newValue) {
        const {dispatch} = this.props;
        dispatch(updateSampleValue(sampleId, fieldId, newValue));
    }

    onResetSampleClick(e, sample) {
        e.preventDefault();

        const {dispatch} = this.props;
        dispatch(resetSampleInList(sample.id));
    }

    onSaveEditedSampleClick(e, sample) {
        e.preventDefault();

        const {dispatch} = this.props;
        dispatch(requestUpdateSampleFields(sample.id))
    }

    setShowValuesState(showValues) {
        this.setState({
            showValues
        });
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
        const {sample} = this.props;
        return (
            <div>
                <div className="panel-heading">
                    <h3 className="panel-title">{sample.fileName}<span>{sample.description}</span></h3>
                </div>
            </div>
        );
    }

    renderFooter() {
        const {sample} = this.props;
        return (
            <div className="panel-footer">

                <a onClick={(e) => this.onSelectForAnalyzisClick(e)}
                   className="btn btn-link btn-uppercase"
                   type="button">
                    <span data-localize="samples.settings.select.title">Select for analysis</span>
                </a>
                {sample.type === 'user'
                && <a onClick={e => this.onShowValuesClick(e)}
                      className="btn btn-link btn-uppercase" role="button"
                      data-toggle="collapse" data-parent="#accordion"
                      href="#collapseOne" aria-expanded="false"
                      aria-controls="collapseOne">Edit
                </a>}
            </div>
        );
    }

    renderSelectField(field) {
        let fieldValue;
        const {sample, samplesList} = this.props;
        const selectOptions = field.availableValues.map(
            option => {
                return {value: option.id, label: option.value}
            }
        );
        const currentSampleIndex = _.findIndex(samplesList.samples, {id: sample.id});

        if (currentSampleIndex >= 0) {
            const storedValue = _.find(samplesList.samples[currentSampleIndex].values || [], item => item.fieldId === field.id);
            fieldValue = storedValue ? storedValue.values : '';
        } else {
            fieldValue = '';
        }

        return (
            <dl key={field.id} className="dl-horizontal">
                <dt>{field.label}</dt>
                <dd>
                    <Select
                        options={selectOptions}
                        clearable={false}
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sample.id, field.id, e.value)}
                    />
                </dd>
            </dl>
        );
    }

    renderTextField(field) {
        let fieldValue;
        const {sample, samplesList: {samples}} = this.props;
        const currentSampleIndex = _.findIndex(samples, {id: sample.id});

        if (currentSampleIndex >= 0) {
            const storedValue = _.find(samples[currentSampleIndex].values || [], item => item.fieldId === field.id);
            fieldValue = storedValue ? storedValue.values : '';
        } else {
            fieldValue = '';
        }

        return (
            <dl key={field.id} className="dl-horizontal">
                <dt>{field.label}</dt>
                <dd>
                    <input
                        type="text"
                        className="form-control"
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sample.id, field.id, e.target.value) }
                    />
                </dd>
            </dl>
        );
    }

    renderRowButtons() {
        const {sample} = this.props;
        return (
            <div className="btn-group ">
                <button
                    onClick={ (e) => this.onResetSampleClick(e, sample) }
                    type="button"
                    className="btn btn-default"
                >
                    <span>Reset</span>
                </button>

                <button
                    onClick={ (e) => this.onSaveEditedSampleClick(e, sample) }
                    type="button"
                    className="btn btn-primary"
                >
                    <span data-localize="actions.save_select.title">Save</span>
                </button>
            </div>
        )
    }

    renderValues() {
        // TODO: Refactor render*Field methods to move all the calculations
        // to the upper level to do them only once.
        return (
            <Panel collapsible
                   expanded={this.state.showValues}
                   className="samples-values form-horizontal-rows"
            >
                <div className="flex">
                    {this.props.fields.map(field => {
                        if (field.availableValues) {
                            return this.renderSelectField(field);
                        } else {
                            return this.renderTextField(field);
                        }

                    })}
                    {this.renderRowButtons()}
                </div>
            </Panel>
        )
    }
}

function mapStateToProps(state) {
    const {ui, samplesList} = state;
    return {
        ui,
        samplesList
    }
}

export default connect(mapStateToProps)(FileUploadSamplesRow)