import React, {Component} from 'react';
import {connect} from 'react-redux';

import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {
    changeSample, receiveSamplesList
} from '../../../actions/samplesList'


export default class FileUploadSamplesRow extends Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    onSelectForAnalysisClick(e, sample) {
        e.preventDefault();
        const {dispatch, closeModal, samplesList: {samples}} = this.props;
        dispatch(receiveSamplesList(samples));
        dispatch(changeSample(sample.id));
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

    render() {
        return (
            <div className='panel'>
                {this.renderHeader()}
                {this.renderCurrentValues()}
                {this.renderEditableValues()}
                {this.renderFooter()}
            </div>
        );
    }

    renderHeader() {
        const {sample} = this.props;
        return (
            <div>
                <div className='panel-heading'>
                    <h3 className='panel-title'>
                        {getItemLabelByNameAndType(sample.fileName, sample.type)}
                        <span>{sample.description}</span>
                    </h3>
                </div>
            </div>
        );
    }

    renderFooter() {
        const {isDemoSession, sample} = this.props;
        return (
            <div className='panel-footer'>
                {this.renderSelectButton(isDemoSession, sample)}
                {this.renderEditButton(sample.type)}
            </div>
        );
    }

    renderSelectButton(isDemoSession, sample) {
        if(isDemoSession && sample.type === 'advanced') {
            return (
                <span data-localize='samples.settings.select.title'>
                    Please register to analyze this sample.
                </span>
            )
        }

        return (
            <a onClick={(e) => this.onSelectForAnalysisClick(e, sample)}
               className='btn btn-link btn-uppercase'
               type='button'
            >
                <span data-localize='samples.settings.select.title'>Select for analysis</span>
            </a>
        )
    }

    renderEditButton(sampleType) {
        if (sampleType === 'user') {
            return (
                <a onClick={e => this.onShowValuesClick(e)}
                   className='btn btn-link btn-uppercase' role='button'
                   data-toggle='collapse' data-parent='#accordion'
                   href='#collapseOne' aria-expanded='false'
                   aria-controls='collapseOne'>Edit
                </a>
            )
        }

        return null;
    }

    renderEditableValues() {
        const {dispatch, fields, samplesList: {editedSamples}, sample} = this.props;
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       isExpanded={this.state.showValues}
                                       fields={fields}
                                       sample={sample}
                                       editedSamples={editedSamples}
            />
        )
    }

    renderCurrentValues() {
        const {sample, fields} = this.props;
        const fieldIdToValuesHash = _.reduce(sample.values, (result, value) => {
            result[value.fieldId] = value.values;
            return result;
        }, {});

        if (_.some(sample.values, option => option.values)) {
            return (
                <div>
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

function mapStateToProps(state) {
    const {ui, samplesList} = state;
    return {
        ui,
        samplesList
    }
}

export default connect(mapStateToProps)(FileUploadSamplesRow)