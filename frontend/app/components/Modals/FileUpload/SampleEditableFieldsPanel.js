import React, {PropTypes} from 'react';
import {Panel} from 'react-bootstrap';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';

import ComponentBase from '../../shared/ComponentBase';

import {
    updateSampleValue, resetSampleInList,
    requestUpdateSampleFields
} from '../../../actions/samplesList'

export default class SampleEditableFieldsPanel extends ComponentBase {
    constructor(...args) {
        super(...args);
    }

    onSampleValueUpdated(sampleId, fieldId, newValue) {
        const {dispatch} = this.props;
        dispatch(updateSampleValue(sampleId, fieldId, newValue));
    }

    onSaveEditedSampleClick(e, sample) {
        e.preventDefault();

        const {dispatch} = this.props;
        dispatch(requestUpdateSampleFields(sample.id))
    }

    onResetSampleClick(e, sample) {
        e.preventDefault();

        const {dispatch} = this.props;
        dispatch(resetSampleInList(sample.id));
    }

    render() {
        if (!this.props.isExpanded) {
            return null;
        }
        const {sample, editedSamples} = this.props;
        const currentSampleIndex = _.findIndex(editedSamples, {id: sample.id});
        const sampleId = sample.id;
        const fieldIdToValuesHash = {};
        if (currentSampleIndex >= 0) {
            _.reduce(editedSamples[currentSampleIndex].values, (result, value) => {
                result[value.fieldId] = value.values;
                return result;
            }, fieldIdToValuesHash);
        }
        return (
            <Panel collapsible
                   expanded={this.props.isExpanded}
                   className="samples-values"
            >
                <div className="flex">
                    {this.props.fields.map(field => this.renderEditableField(sampleId, field, fieldIdToValuesHash))}
                    {this.renderRowButtons()}
                </div>
            </Panel>
        );
    }

    renderEditableField(sampleId, field, fieldIdToValuesHash) {
        const fieldValue = fieldIdToValuesHash[field.id] || '';
        if (field.availableValues) {
            return this.renderSelectField(sampleId, field, fieldValue);
        } else {
            return this.renderTextField(sampleId, field, fieldValue);
        }
    }

    renderRowButtons() {
        const {sample} = this.props;
        return (
          <dl className="dl-horizontal dl-btns">
              <dd>
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
              </dd>
          </dl>
        )
    }

    renderSelectField(sampleId, field, fieldValue) {
        const selectOptions = field.availableValues.map(
            option => {
                return {value: option.id, label: option.value}
            }
        );

        return (
            <dl key={field.id} className="dl-horizontal">
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
            <dl key={field.id} className="dl-horizontal">
                <dt>{field.label}</dt>
                <dd>
                    <input
                        type="text"
                        className="form-control"
                        value={fieldValue}
                        onChange={(e) => this.onSampleValueUpdated(sampleId, field.id, e.target.value) }
                    />
                </dd>
            </dl>
        );
    }
}

SampleEditableFieldsPanel.propTypes = {
    sample: PropTypes.object.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    editedSamples: PropTypes.array.isRequired,
    fields: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
};
