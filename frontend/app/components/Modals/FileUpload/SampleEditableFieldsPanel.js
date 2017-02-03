import React, {PropTypes} from 'react';
import _ from 'lodash';
import 'react-select/dist/react-select.css';

import Select from '../../shared/Select';
import ComponentBase from '../../shared/ComponentBase';
import {
    updateSampleValue, resetSampleInList,
    requestUpdateSampleFieldsAsync,
    sampleSaveCurrentIfSelected,
    setCurrentSampleId,
    setEditingSampleId
} from '../../../actions/samplesList';
import config from '../../../../config';
import * as i18n from '../../../utils/i18n';

export default class SampleEditableFieldsPanel extends ComponentBase {
    constructor(...args) {
        super(...args);
    }

    onSampleValueUpdated(sampleId, fieldId, newValue) {
        const {dispatch, languageId} = this.props;
        dispatch(updateSampleValue(sampleId, fieldId, newValue, languageId));
    }

    onSaveEditedSampleClick(e, sampleId) {
        e.preventDefault();

        const {dispatch, changeShowValues} = this.props;
        dispatch(requestUpdateSampleFieldsAsync(sampleId))
            .then((newSample) => {
                dispatch(sampleSaveCurrentIfSelected(sampleId, newSample.id));
                dispatch(setCurrentSampleId(newSample.id));
                dispatch(setEditingSampleId(newSample.id));
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
        const {sampleId, fieldIdToValuesHash, fields, disabled, languageId} = this.props;
        const visibleEditableFields = _.filter(fields, field => !field.isInvisible);
        return (
            <div>
                {visibleEditableFields.map(field => this.renderEditableField(sampleId, field, fieldIdToValuesHash, disabled, languageId))}
                {this.renderRowButtons()}
            </div>
        );
    }

    renderEditableField(sampleId, field, fieldIdToValuesHash, disabled, languageId) {
        const fieldValue = fieldIdToValuesHash[field.id] || '';
        if (!_.isEmpty(field.availableValues)) {
            return this.renderSelectField(sampleId, field, fieldValue, disabled, languageId);
        } else {
            return this.renderTextField(sampleId, field, fieldValue, disabled, languageId);
        }
    }

    renderRowButtons() {
        const {sampleId, p} = this.props;
        return (
            <div>
                <hr/>
                <div className='btn-toolbar btn-toolbar-form-actions'>
                    <button
                        onClick={ (e) => this.onSaveEditedSampleClick(e, sampleId) }
                        type='button'
                        className='btn btn-link btn-uppercase'
                    >
                        <span>{p.t('samples.editingSample.save')}</span>
                    </button>

                    <button
                        onClick={ (e) => this.onCancelSampleClick(e, sampleId) }
                        type='button'
                        className='btn btn-link-default btn-uppercase'
                    >
                        <span>{p.t('samples.editingSample.cancel')}</span>
                    </button>
                </div>
            </div>
        );
    }

    renderSelectField(sampleId, field, fieldValue, disabled, languageId) {
        const selectOptions = field.availableValues.map(
            option => {
                return {value: option.id, label: i18n.getEntityText(option, languageId).value};
            }
        );

        return (
            <dl key={field.id}>
                <dt>{i18n.getEntityText(field, languageId).label}</dt>
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

    renderTextField(sampleId, field, fieldValue, disabled, languageId) {
        return (
            <dl key={field.id}>
                <dt>{i18n.getEntityText(field, languageId).label}</dt>
                <dd>
                    <input
                        type='text'
                        className='form-control'
                        value={fieldValue}
                        maxLength={config.SAMPLES.MAX_PROPERTY_LENGTH}
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
    disabled: PropTypes.bool,
    languageId: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
};
