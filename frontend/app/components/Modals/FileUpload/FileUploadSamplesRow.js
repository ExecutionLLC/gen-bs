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
        return _(sample.values)
            .keyBy((value) => value.fieldId)
            .mapValues((values) => values.values) // yes, values.values, we need all samples.values.values'es
            .value();
    }

    render() {
        const {sampleId, samplesList: {hashedArray: {hash: samplesHash}, editedSamplesHash}} = this.props;
        const {showValues} = this.state;
        const sample = samplesHash[sampleId];
        const fieldIdToValuesHash = this.makeFieldIdToValuesHash(sample);
        const editedSample = showValues && editedSamplesHash[sampleId];
        const editedFieldIdToValuesHash = editedSample && this.makeFieldIdToValuesHash(editedSample);

        return (
            <div className='panel'>
                {this.renderHeader()}
                {!showValues && this.renderCurrentValues(fieldIdToValuesHash)}
                {showValues && editedFieldIdToValuesHash && this.renderEditableValues(editedFieldIdToValuesHash)}
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
            <div className='panel-heading'>
                <h3 className='panel-title'>
                    {getItemLabelByNameAndType(sampleName, sample.type)}
                    <span>{sample.description}</span>
                </h3>
            </div>
        );
    }

    renderFooter() {
        const {isDemoSession, sampleId, samplesList: {hashedArray: {hash: samplesHash}, onSaveAction}} = this.props;
        const sample = samplesHash[sampleId];
        return (
            <div className='panel-footer'>
                {onSaveAction && this.renderSelectButton(isDemoSession, sample)}
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
        const {dispatch, fields, sampleId, samplesList: {disabledSamples}} = this.props;
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       fields={fields}
                                       sampleId={sampleId}
                                       fieldIdToValuesHash={fieldIdToValuesHash}
                                       disabled={!!disabledSamples[sampleId]}
            />
        );
    }

    renderCurrentValues(fieldIdToValuesHash) {
        const {sampleId, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        const sample = samplesHash[sampleId];

        if (_.some(sample.values, option => option.values)) {
            return (
                <div className='panel-body view-mode'>
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
        const fieldValues = fieldIdToValuesHash[field.id];
        if (fieldValues) {
            let fieldValue = fieldValues;
            // If field has available values, then the value is id of the actual option.
            // We then need to retrieve the actual value corresponding to the option.
            if (!_.isEmpty(field.availableValues)) {
                const option = _.find(field.availableValues,
                    availableValue => availableValue.id === fieldValue);
                fieldValue = option.value;
            }
            return (
                <dl key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{fieldValue}</dd>
                </dl>
            );
        } else {
            return null;
        }
    }
}
