import React, {PropTypes} from 'react';
import _ from 'lodash';
import 'react-select/dist/react-select.css';

import Select from '../../shared/Select';
import ComponentBase from '../../shared/ComponentBase';
import {
    updateSampleValue, resetSampleInList,
    requestUpdateSampleFieldsAsync,
    sampleSaveCurrentIfSelected,
    setCurrentSampleId
} from '../../../actions/samplesList';

export default class SampleEditableFieldsPanel extends ComponentBase {
    constructor(...args) {
        super(...args);
    }

    onSampleValueUpdated(sampleId, fieldId, newValue) {
        const {dispatch} = this.props;
        dispatch(updateSampleValue(sampleId, fieldId, newValue));
    }

    onSaveEditedSampleClick(e, sampleId) {
        e.preventDefault();

        const {dispatch,changeShowValues} = this.props;
        dispatch(requestUpdateSampleFieldsAsync(sampleId))
            .then((newSample) => {
                dispatch(sampleSaveCurrentIfSelected(sampleId, newSample.id));
                dispatch(setCurrentSampleId(newSample.id));
                changeShowValues(false);
            });
    }

    onCancelSampleClick(e, sampleId) {
        e.preventDefault();

        const {dispatch, changeShowValues} = this.props;
        dispatch(resetSampleInList(sampleId));
        changeShowValues(false);
    }

    render() {
        const {sampleId, fieldIdToValuesHash, fields} = this.props;
        const visibleEditableFields = _.filter(fields, field => !field.isInvisible);
        return (
            <div className='sample-mode3 collapse in'>
                {visibleEditableFields.map(field => this.renderEditableField(sampleId, field, fieldIdToValuesHash))}
                {this.renderRowButtons()}
            </div>
        );
    }

    renderEditableField(sampleId, field, fieldIdToValuesHash) {
        const fieldValue = fieldIdToValuesHash[field.id] || '';
        if (!_.isEmpty(field.availableValues)) {
            return this.renderSelectField(sampleId, field, fieldValue);
        } else {
            return this.renderTextField(sampleId, field, fieldValue);
        }
    }

    renderRowButtons() {
        const {sampleId} = this.props;
        return (
            <div className='btn-toolbar'>
                <button
                    onClick={ (e) => this.onSaveEditedSampleClick(e, sampleId) }
                    type='button'
                    className='btn btn-link btn-uppercase'
                >
                    <span data-localize='actions.save_select.title'>Save</span>
                </button>

                <button
                    onClick={ (e) => this.onCancelSampleClick(e, sampleId) }
                    type='button'
                    className='btn btn-link-default btn-uppercase'
                >
                    <span>Cancel</span>
                </button>

            </div>
        );
    }

    renderSelectField(sampleId, field, fieldValue) {
        const selectOptions = field.availableValues.map(
            option => {
                return {value: option.id, label: option.value};
            }
        );

        return (
            <dl key={field.id}>
                <dt>{field.label}</dt>
                <dd>
                    <Select
                        options={selectOptions}
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sampleId, field.id, e.value)}
                    />
                </dd>
            </dl>
        );
    }

    renderTextField(sampleId, field, fieldValue) {
        return (
            <dl key={field.id}>
                <dt>{field.label}</dt>
                <dd>
                    <input
                        type='text'
                        className='form-control'
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sampleId, field.id, e.target.value) }
                    />
                </dd>
            </dl>
        );
    }
}

SampleEditableFieldsPanel.propTypes = {
    sampleId: PropTypes.string.isRequired,
    fieldIdToValuesHash: PropTypes.object.isRequired,
    fields: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
};
