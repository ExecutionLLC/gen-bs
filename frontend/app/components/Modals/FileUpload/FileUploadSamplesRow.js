import React, {Component} from 'react';
import _ from 'lodash';

import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {sampleSaveCurrent} from '../../../actions/samplesList';
import {entityTypeIsEditable, entityTypeIsDemoDisabled} from '../../../utils/entityTypes';


export default class FileUploadSamplesRow extends Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    onSelectForAnalysisClick(e, sampleId) {
        e.preventDefault();
        const {dispatch, closeModal} = this.props;
        dispatch(sampleSaveCurrent(sampleId));
        closeModal('upload');
    }

    setShowValuesState(showValues) {
        this.setState({
            showValues
        });
    }

    onShowValuesClick(e) {
        e.preventDefault();
        this.setShowValuesState(!this.state.showValues);
    }

    makeFieldIdToValuesHash(sample) {
        return _.reduce(sample.values, (result, value) => {
            return {...result, [value.fieldId]: value.values};
        }, {});
    }

    render() {
        const {sampleId, samplesList: {hashedArray: {hash: samplesHash}, editedSamplesHash}} = this.props;
        const sample = samplesHash[sampleId];
        const fieldIdToValuesHash = this.makeFieldIdToValuesHash(sample);
        const editedSample = this.state.showValues && editedSamplesHash[sampleId];
        const editedFieldIdToValuesHash = editedSample && this.makeFieldIdToValuesHash(editedSample);

        return (
            <div className='panel'>
                {this.renderHeader()}
                {this.renderCurrentValues(fieldIdToValuesHash)}
                {this.state.showValues && editedFieldIdToValuesHash && this.renderEditableValues(editedFieldIdToValuesHash)}
                {this.renderFooter()}
            </div>
        );
    }

    renderHeader() {
        const {sampleId, samplesList: {hashedArray: {hash: samplesHash}}} = this.props;
        const sample = samplesHash[sampleId];
        const {fileName, genotypeName} = sample;
        const sampleName = genotypeName ? `${fileName}:${genotypeName}` : fileName;
        return (
            <div>
                <div className='panel-heading'>
                    <h3 className='panel-title'>
                        {getItemLabelByNameAndType(sampleName, sample.type)}
                        <span>{sample.description}</span>
                    </h3>
                </div>
            </div>
        );
    }

    renderFooter() {
        const {isDemoSession, sampleId, samplesList: {hashedArray: {hash: samplesHash}}} = this.props;
        const sample = samplesHash[sampleId];
        return (
            <div className='panel-footer'>
                {this.renderSelectButton(isDemoSession, sample)}
                {this.renderEditButton(sample.type)}
            </div>
        );
    }

    renderSelectButton(isDemoSession, sample) {
        if(entityTypeIsDemoDisabled(sample.type, isDemoSession)) {
            return (
                <span data-localize='samples.settings.select.title'>
                    Please register to analyze this sample.
                </span>
            );
        }

        return (
            <a onClick={(e) => this.onSelectForAnalysisClick(e, sample.id)}
               className='btn btn-link btn-uppercase'
               type='button'
            >
                <span data-localize='samples.settings.select.title'>Select for analysis</span>
            </a>
        );
    }

    renderEditButton(sampleType) {
        if (entityTypeIsEditable(sampleType)) {
            return (
                <a onClick={e => this.onShowValuesClick(e)}
                   className='btn btn-link btn-uppercase' role='button'
                   data-toggle='collapse' data-parent='#accordion'
                   href='#collapseOne' aria-expanded='false'
                   aria-controls='collapseOne'>Edit
                </a>
            );
        }

        return null;
    }

    renderEditableValues(fieldIdToValuesHash) {
        const {dispatch, fields, sampleId} = this.props;
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       fields={fields}
                                       sampleId={sampleId}
                                       fieldIdToValuesHash={fieldIdToValuesHash}
            />
        );
    }

    renderCurrentValues(fieldIdToValuesHash) {
        const {sampleId, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        const sample = samplesHash[sampleId];

        if (_.some(sample.values, option => option.values)) {
            return (
                <div className='panel-body'>
                    <div className='flex'>
                        {fields.map(field => this.renderReadOnlyField(field, fieldIdToValuesHash))}
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    renderReadOnlyField(field, fieldIdToValuesHash) {
        if (fieldIdToValuesHash[field.id]) {
            let fieldValue = fieldIdToValuesHash[field.id];
            // If field has available values, then the value is id of the actual option.
            // We then need to retrieve the actual value corresponding to the option.
            if (!_.isEmpty(field.availableValues)) {
                const option = _.find(field.availableValues,
                    availableValue => availableValue.id === fieldValue);
                fieldValue = option.value;
            }
            return (
                <dl key={field.id}
                    className='dl-horizontal'>
                    <dt>{field.label}</dt>
                    <dd>{fieldValue}</dd>
                </dl>
            );
        } else {
            return null;
        }
    }
}
