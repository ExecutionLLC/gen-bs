import _ from 'lodash';
import React from 'react';
import Input from '../../shared/Input';
import {entityTypeIsEditable} from "../../../utils/entityTypes";
import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';
import {entityTypeIsDemoDisabled} from "../../../utils/entityTypes";
import {sampleSaveCurrent} from '../../../actions/samplesList';
import {addFilesForUpload} from "../../../actions/fileUpload";
import {clearUploadState} from "../../../actions/fileUpload";

export default class FileUploadSampleRightPane extends React.Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    componentWillMount() {
        this.props.dispatch(clearUploadState());
    }

    render() {
        const {selectedSample, disabled, auth: {isDemo}, fields} = this.props;
        debugger;
        return (
            <div>
                {selectedSample && this.renderSampleHeader(selectedSample, disabled, isDemo)}
                {selectedSample &&
                <div className='split-scroll form-horizontal'>
                    <div className='form-rows'>
                        {this.renderSampleContent(selectedSample, fields, disabled)}
                    </div>
                </div>}
                {!selectedSample && this.renderUpload()}
            </div>
        );
    }

    renderUpload() {
        const {auth: {isDemo},fileUpload: {filesProcesses}} = this.props;
        if (isDemo) {
            return this.renderDemoContent();
        } else {
            return (
                <div className='panel file-upload-panel panel-default'>
                    <div className='panel-body'>
                        {this.renderUploadButton()}
                        {filesProcesses.map((fp, index) => this.renderMultiFile(fp, index))}
                    </div>
                </div>
            );
        }
    }

    renderMultiFile(fileProcess, index) {
        const {file, error, isArchiving, progressStatus, progressValue} = fileProcess;
        return (
            <div key={index}>
                {this.renderFileInfo(file)}
            </div>
        );
    }

    renderFileInfo(file) {
        return (
            <div className='text-center'>
                <strong style={{color: '#2363a1'}}>{file.name}</strong>
            </div>
        );
    }

    renderUploadButton() {
        return (
            <button onClick={this.onUploadClick.bind(this)}
                // uncomment when drag'n'drop will need
                // onDragEnter={(e) => this.onDragEnter(e)}
                // onDragOver={(e) => this.onDragOver(e)}
                // onDrop={(e) => this.onDrop(e)}
                    className='btn-link-light-default btn-select-file'>
                <input
                    onChange={ (e) => this.onUploadChanged(e.target.files)}
                    style={{display: 'none'}}
                    ref='fileInput'
                    id='file-select'
                    type='file'
                    accept='.vcf,.gz'
                    name='files[]'
                />
                <i className='md-i'>cloud_upload</i>
                <span>Click here to upload new samples</span>
                <span>.vcf, .vcf.gz</span>
            </button>
        );
    }

    onUploadChanged(files) {
        const {dispatch} = this.props;
        dispatch(addFilesForUpload([files[0]]));
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }

    makeFieldIdToValuesHash(sample) {
        return _(sample.values)
            .keyBy((value) => value.fieldId)
            .mapValues((values) => values.values) // yes, values.values, we need all samples.values.values'es
            .value();
    }

    renderCurrentValues(sample, fieldIdToValuesHash, fields) {
        // const {sampleId, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        // const sample = samplesHash[sampleId];
        debugger;
        if (_.some(sample.values, option => option.values)) {
            return (
                <div className='panel-body'>
                    <div className='flex'>
                        {fields.map(field => this.renderReadOnlyField(field, fieldIdToValuesHash))}
                    </div>
                </div>
            );
        } else {
            debugger;
            return null;
        }
    }

    renderFooter() {
        const {auth: {isDemo}, selectedSample} = this.props;
        return (
            <div className='panel-footer'>
                {this.renderSelectButton(isDemo, selectedSample)}
                {this.renderEditButton(selectedSample.type)}
            </div>
        );
    }

    renderSelectButton(isDemoSession, sample) {
        if (entityTypeIsDemoDisabled(sample.type, isDemoSession)) {
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

    renderReadOnlyField(field, fieldIdToValuesHash) {
        debugger;
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

    renderSampleContent(selectedSample, fields, disabled) {
        const fieldIdToValuesHash = this.makeFieldIdToValuesHash(selectedSample);
        return (
            <div>
                {this.renderCurrentValues(selectedSample, fieldIdToValuesHash, fields)}
                {this.state.showValues && this.renderEditableValues(selectedSample.id, fieldIdToValuesHash, fields)}
                {this.renderFooter()}
            </div>
        );
    }

    renderEditableValues(sampleId, fieldIdToValuesHash, fields) {
        const {dispatch} = this.props;
        debugger;
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       fields={fields}
                                       sampleId={sampleId}
                                       fieldIdToValuesHash={fieldIdToValuesHash}
            />
        );
    }

    renderSampleHeader(sampleItem, disabled, isDemo) {
        return (
            <div
                className='split-right-top split-right-top-tabs form-horizontal'>
                {sampleItem.id && this.renderDeleteSampleButton()}
                {this.renderSampleFileName(sampleItem.fileName, !entityTypeIsEditable(sampleItem.type))}
                {this.renderSampleDates(sampleItem.uploadedDate, disabled.updatedDate)}
            </div>
        );
    }

    renderSampleDates(createdDate, lastQueryDate) {
        // debugger;
        return (
            <div className='label-date'>
                <label>
                    <span
                        data-localize='general.created_date'>Uploaded date</span>:
                    <span>Some Date</span>
                </label>
                <label>
                    <span
                        data-localize='query.last_query_date'>Updated date</span>:
                    <span>Some Date</span>
                </label>
            </div>
        );
    }

    renderSampleFileName(name, disabled) {
        debugger;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={name}
                        disabled={disabled}
                        className='form-control material-input-sm material-input-heading text-primary'
                        placeholder="Analysis name (it can't be empty)"
                        data-localize='query.settings.name'
                        maxLength={50}
                        onChange={(str) => this.onAnalysisNameChange(str)}
                    />
                </div>
            </div>
        );
    }

    renderDeleteSampleButton() {
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
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
        debugger;
        closeModal('upload');
    }

    onDeleteSampleClick() {

    }
}