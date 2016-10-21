import React, {PropTypes} from 'react';
import _ from 'lodash';
import 'react-select/dist/react-select.css';

import Select from '../../shared/Select';
import ComponentBase from '../../shared/ComponentBase';
import {
    updateSampleValue, resetSampleInList,
    requestUpdateSampleFieldsAsync,
    sampleSaveCurrentIfSelected
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

        const {dispatch} = this.props;
        dispatch(requestUpdateSampleFieldsAsync(sampleId))
            .then((newSample) => {
                dispatch(sampleSaveCurrentIfSelected(sampleId, newSample.id));
            });
    }

    onResetSampleClick(e, sampleId) {
        e.preventDefault();

        const {dispatch} = this.props;
        dispatch(resetSampleInList(sampleId));
    }

    render() {
        const {sampleId, fieldIdToValuesHash, fields, disabled} = this.props;
        const visibleEditableFields = _.filter(fields, field => !field.isInvisible);
        return (
            <div className='panel-body edit-mode'>
                <div className='flex'>
                    {visibleEditableFields.map(field => this.renderEditableField(sampleId, field, fieldIdToValuesHash, disabled))}
                    {this.renderRowButtons()}
                </div>
            </div>
        );
    }

    renderEditableField(sampleId, field, fieldIdToValuesHash, disabled) {
        const fieldValue = fieldIdToValuesHash[field.id] || '';
        if (!_.isEmpty(field.availableValues)) {
            return this.renderSelectField(sampleId, field, fieldValue, disabled);
        } else {
            return this.renderTextField(sampleId, field, fieldValue, disabled);
        }
    }

    renderRowButtons() {
        const {sampleId, disabled} = this.props;
        return (
          <dl className='dl-horizontal dl-btns'>
              <dd>
                  <div className='btn-group '>
                      <button
                          onClick={ (e) => this.onResetSampleClick(e, sampleId) }
                          type='button'
                          className='btn btn-default'
                          disabled={disabled}
                      >
                          <span>Reset</span>
                      </button>
      
                      <button
                          onClick={ (e) => this.onSaveEditedSampleClick(e, sampleId) }
                          type='button'
                          className='btn btn-primary'
                          disabled={disabled}
                      >
                          <span data-localize='actions.save_select.title'>Save</span>
                      </button>
                  </div>
              </dd>
          </dl>
        );
    }

    renderSelectField(sampleId, field, fieldValue, disabled) {
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
                        disabled={disabled}
                    />
                </dd>
            </dl>
        );
    }

    renderTextField(sampleId, field, fieldValue, disabled) {
        return (
            <dl key={field.id}>
                <dt>{field.label}</dt>
                <dd>
                    <input
                        type='text'
                        className='form-control'
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sampleId, field.id, e.target.value) }
                        disabled={disabled}
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
    disabled: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired
};
