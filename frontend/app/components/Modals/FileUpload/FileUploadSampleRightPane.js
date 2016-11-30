import _ from 'lodash';
import React from 'react';
import Input from '../../shared/Input';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';
import {entityTypeIsDemoDisabled} from '../../../utils/entityTypes';
import {sampleSaveCurrent} from '../../../actions/samplesList';
import {uploadFiles} from '../../../actions/fileUpload';
import {formatDate} from './../../../utils/dateUtil';
import {
    updateSampleText,
    requestUpdateSampleTextAsync,
    sampleSaveCurrentIfSelected,
    setCurrentSampleId
} from '../../../actions/samplesList';
import config from '../../../../config';


function cancelDOMEvent(e) {
    e.stopPropagation();
    e.preventDefault();
}

export default class FileUploadSampleRightPane extends React.Component {

    render() {
        const {samplesList: {editingSample}} = this.props;
        return (
            <div className='split-right'>
                {editingSample && this.renderSampleHeader()}
                <div className='split-scroll'>
                    <div className='form-padding'>
                        {this.renderSample()}
                    </div>
                </div>
            </div>
        );
    }

    renderSample() {
        const {currentSampleId, auth:{isDemo}, fileUpload:{currentUploadId}, samplesList:{hashedArray:{hash:samplesHash}}} = this.props;
        const selectedSample = currentSampleId ? samplesHash[currentSampleId] : null;
        if (selectedSample) {
            return (
                <div
                    className='form-horizontal form-rows form-rows-2row-xs'>
                    {this.renderSampleContent(selectedSample)}
                </div>
            );
        }
        return currentUploadId != null ? this.renderLoad() : this.renderUpload(isDemo);
    }

    renderLoad() {
        return null;
    }

    renderUpload(isDemo) {
        return (
            <div className='form-horizontal form-padding'>
                <div className='empty empty-upload collapse sample-mode1 in'>
                    <div className='btn-group btn-group-xlg'>
                        {!isDemo && <button className='btn btn-link-default'
                                            onClick={this.onUploadClick.bind(this)}
                                            onDragEnter={cancelDOMEvent}
                                            onDragOver={cancelDOMEvent}
                                            onDrop={(e) => {
                                                cancelDOMEvent(e);
                                                this.onFilesDrop(e.dataTransfer.files);
                                            }}
                        >
                            <input
                                onChange={ (e) => {
                                    this.onUploadChanged(e.target.files);
                                    e.target.value = null;
                                }}
                                style={{display: 'none'}}
                                ref='fileInput'
                                id='file-select'
                                type='file'
                                accept='.vcf,.gz'
                                name='files[]'
                                defaultValue=''
                                multiple='multiple'
                            />
                            <h3>Drop vcf files here or <span
                                className='text-underline'>click here</span> to
                                select</h3>
                        </button>
                        }
                        {isDemo &&
                        <h3><i className='md-i'>perm_identity</i>Please login or
                            register to upload new samples</h3>}
                    </div>
                </div>
            </div>
        );
    }

    onUploadChanged(files) {
        const {dispatch} = this.props;
        dispatch(uploadFiles(files));
    }

    onFilesDrop(files) {
        const {dispatch} = this.props;
        dispatch(uploadFiles(files));
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }

    static makeFieldIdToValuesHash(sample) {
        return _(sample.editableFields.fields)
            .keyBy((value) => value.fieldId)
            .mapValues((values) => values.value)
            .value();
    }

    renderCurrentValues(sample) {
        const {fields} = this.props;
        const fieldIdToValuesHash = FileUploadSampleRightPane.makeFieldIdToValuesHash(sample);
        if (_.some(sample.editableFields.fields, option => option.value)) {
            const fieldsRenders = fields
                .filter(field => !field.isInvisible)
                .map(field => this.renderReadOnlyField(field, fieldIdToValuesHash));
            return (_.some(fieldsRenders, fieldRender => !!fieldRender) &&
                <div className='sample-mode3 collapse in'>
                    {fieldsRenders}
                </div>
            );
        } else {
            return null;
        }
    }

    renderFooter(selectedSample) {
        const {auth: {isDemo}, samplesList: {onSaveAction}} = this.props;
        return (
            <div className='panel-footer'>
                {onSaveAction && this.renderSelectButton(isDemo, selectedSample)}
                {this.renderEditButton(selectedSample.type)}
            </div>
        );
    }

    renderSelectButton(isDemoSession, sample) {
        if (entityTypeIsDemoDisabled(sample.type, isDemoSession)) {
            return (
                <span>
                    Please register to analyze this sample.
                </span>
            );
        }

        return (
            <a onClick={(e) => this.onSelectForAnalysisClick(e, sample.id)}
               className='btn btn-link btn-uppercase'
               type='button'
            >
                <span>Select for analysis</span>
            </a>
        );
    }

    renderEditButton(sampleType) {
        if (entityTypeIsEditable(sampleType)) {
            return (
                <a onClick={() => this.onShowValuesClick()}
                   className='btn btn-link btn-uppercase' role='button'
                   href='#'>Edit
                </a>
            );
        }

        return null;
    }

    onShowValuesClick() {
        const {changeShowValues, edited} = this.props;
        changeShowValues(!edited);
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
                <dl key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{fieldValue}</dd>
                </dl>
            );
        } else {
            return null;
        }
    }

    renderSampleContent(selectedSample) {
        const {edited} = this.props;
        return (
            <div>
                {!edited && this.renderCurrentValues(selectedSample)}
                {!edited && this.renderFooter(selectedSample)}
                {edited && this.renderEditableValues(selectedSample.id)}
            </div>
        );
    }

    renderEditableValues(sampleId) {
        const {dispatch, changeShowValues, fields, samplesList: {editingSample, editingSampleDisabled}} = this.props;
        if (!editingSample || editingSample.id !== sampleId) {
            return null;
        }
        const fieldIdToValuesHash = FileUploadSampleRightPane.makeFieldIdToValuesHash(editingSample);
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       fields={fields}
                                       sampleId={sampleId}
                                       fieldIdToValuesHash={fieldIdToValuesHash}
                                       changeShowValues={changeShowValues}
                                       disabled={editingSampleDisabled}
            />
        );
    }

    renderSampleHeader() {
        const {samplesList: {editingSample}} = this.props;
        return (
            <div className='split-top'>
                <div className='form-horizontal form-padding'>
                    {this.renderDeleteSampleButton()}
                    {this.renderSampleFileName()}
                    {this.renderSampleDates(editingSample.timestamp)}
                    {this.renderSampleDescription()}
                </div>
            </div>
        );
    }

    renderSampleDescription() {
        const {samplesList: {editingSample: {editableFields: {description}, id}}} = this.props;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={description || ''}
                        placeholder='Sample description (optional)'
                        className='form-control material-input-sm'
                        data-localize='query.settings.description'
                        maxLength={config.UPLOADS.MAX_DESCRIPTION_LENGTH}
                        onChange={(e) => this.onSampleTextChange(id, null, e)}
                    />
                </div>
            </div>
        );
    }

    renderSampleDates(createdDate) {
        return (
            <div className='label-date'>
                <label>
                    Uploaded: {formatDate(createdDate)}
                </label>
            </div>
        );
    }

    renderSampleFileName() {
        const {samplesList: {editingSample: {editableFields: {name}, id}}} = this.props;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={name}
                        className='form-control material-input-sm material-input-heading text-primary'
                        placeholder="Sample name (it can't be empty)"
                        data-localize='query.settings.name'
                        maxLength={config.UPLOADS.MAX_NAME_LENGTH}
                        onChange={(e) => this.onSampleTextChange(id, e, null)}
                    />
                </div>
            </div>
        );
    }

    onSampleTextChange(sampleId, sampleName, sampleDescription) {
        const {dispatch, samplesList: {editingSample: {editableFields: {name, description}}}} = this.props;
        const newName = sampleName || name;
        const newDescription = sampleDescription || description;
        dispatch(updateSampleText(sampleId, newName, newDescription));
        dispatch(requestUpdateSampleTextAsync(sampleId))
            .then((newSample) => {
                dispatch(sampleSaveCurrentIfSelected(sampleId, newSample.id));
                dispatch(setCurrentSampleId(newSample.id));
            });
    }

    renderDeleteSampleButton() {
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form disabled'
                onClick={() => this.onDeleteSampleClick()}
            >
                <span data-localize='query.delete_sample'>Delete sample</span>
            </button>
        );
    }

    onSelectForAnalysisClick(e, sampleId) {
        e.preventDefault();
        const {dispatch, closeModal} = this.props;
        dispatch(sampleSaveCurrent(sampleId));
        closeModal('upload');
    }

    onDeleteSampleClick() {
        throw new Error('Not implemented');
    }
}