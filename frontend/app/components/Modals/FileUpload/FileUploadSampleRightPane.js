import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import Input from '../../shared/Input';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';
import {entityTypeIsDemoDisabled} from '../../../utils/entityTypes';
import {sampleSaveCurrent} from '../../../actions/samplesList';
import {
    uploadFiles,
    fileUploadStatus
} from '../../../actions/fileUpload';
import {formatDate} from './../../../utils/dateUtil';
import {
    updateSampleText,
    requestUpdateSampleTextAsync,
    sampleSaveCurrentIfSelected,
    setCurrentSampleId,
    samplesListServerRemoveSample
} from '../../../actions/samplesList';
import config from '../../../../config';
import {modalName} from '../../../actions/modalWindows';


function cancelDOMEvent(e) {
    e.stopPropagation();
    e.preventDefault();
}

// SampleHeader contains current editing name and description in its Inputs states
// and must re-render only if props are changed to prevent clearing the name and description.
class SampleHeader extends React.Component {

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return this.props.samplesList.editingSample !== nextProps.samplesList.editingSample;
    }

    render() {
        const {samplesList: {editingSample}} = this.props;
        return (
            <div className='split-top'>
                {editingSample && this.renderSampleHeader()}
            </div>
        );
    }

    renderSampleHeader() {
        const {samplesList: {editingSample}, fileUpload: {filesProcesses}} = this.props;
        const uploadedDate = _.some(filesProcesses, (fileProcess) =>
        fileProcess.operationId === editingSample.vcfFileId && fileProcess.progressStatus !== fileUploadStatus.READY)
            ? null
            : editingSample.created;
        return (
            <div className='form-horizontal form-padding'>
                {this.renderDeleteSampleButton()}
                {this.renderSampleFileName()}
                {this.renderSampleDates(uploadedDate)}
                {this.renderSampleDescription()}
            </div>
        );
    }

    renderSampleDescription() {
        const {auth: {isDemo}, samplesList: {editingSample: {description, id, type}}} = this.props;
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
                        disabled={!entityTypeIsEditable(type) || isDemo}
                    />
                </div>
            </div>
        );
    }

    renderSampleDates(createdDate) {
        return (
            <div className='label-group-date'>
                {createdDate ? (
                        <label>Uploaded: {formatDate(createdDate)}</label>
                    ) : (
                        <label><span className='text-primary'><i className='md-i'>schedule</i>Wait. Saving</span></label>
                    )}
            </div>
        );
    }

    renderSampleFileName() {
        const {auth: {isDemo}, samplesList: {editingSample: {name, id, type}}} = this.props;
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
                        disabled={!entityTypeIsEditable(type) || isDemo}
                    />
                </div>
            </div>
        );
    }

    onSampleTextChange(sampleId, sampleName, sampleDescription) {
        const {dispatch, samplesList: {editingSample: {name, description}}} = this.props;
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
        const {samplesList: {editingSample}} = this.props;
        if (entityTypeIsEditable(editingSample.type)) {
            return (
                <button
                    className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                    onClick={() => this.onSampleItemDelete(editingSample.id)}
                >
                    <span data-localize='query.delete_sample'>Delete sample</span>
                </button>
            );
        }
    }
}

export default class FileUploadSampleRightPane extends React.Component {

    constructor(props) {
        super(props);
        this.state = {isDragoverState: false};
    }

    render() {
        const {samplesList, auth, dispatch, fileUpload, isBringToFront} = this.props;
        return (
            <div className={classNames({'split-right': true, 'bring-to-front': isBringToFront})}>
                <SampleHeader samplesList={samplesList}
                              auth={auth}
                              fileUpload={fileUpload}
                              dispatch={dispatch}
                />
                {this.renderSample()}
            </div>
        );
    }

    renderSample() {
        const {
            currentSampleId,
            auth: {isDemo},
            fileUpload: {currentUploadId, filesProcesses},
            samplesList: {hashedArray: {hash: samplesHash}}
        } = this.props;
        const selectedSample = currentSampleId ? samplesHash[currentSampleId] : null;
        if (selectedSample) {
            return (
                <div className='split-scroll'>
                    <div className='form-padding'>
                        {this.renderSampleContent(selectedSample)}
                    </div>
                </div>
            );
        }
        if (currentUploadId == null) {
            return this.renderUpload(isDemo);
        }
        const fileProcess = _.find(
            filesProcesses,
            fp => fp.id === currentUploadId || fp.operationId === currentUploadId
        );
        if (fileProcess && fileProcess.error) {
            return this.renderLoadError();
        } else {
            return this.renderLoad();
        }
    }

    renderLoad() {
        return (
            <div className='split-scroll'>
                <div className='form-horizontal form-padding'>
                    <div className='alert alert-help'>
                        <p>
                            <strong>Wait. </strong><span>File is loading</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    renderLoadError() {
        return (
            <div className='split-scroll'>
                <div className='form-horizontal form-padding'>
                    <div className='alert alert-danger'>
                        <p>
                            <strong>Error!</strong><span>File not loaded or damaged</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    renderUpload(isDemo) {
        const {isDragoverState} = this.state;
        return (
            <div className='split-scroll'>
                <div className='form-horizontal form-padding'>
                    <div className={classNames('empty', {'empty-upload': !isDemo})}>
                        <div className='btn-group btn-group-xlg'>
                            {!isDemo &&
                            <button className={classNames('btn btn-link-default', {'drop-zone': isDragoverState})}
                                    onClick={this.onUploadClick.bind(this)}
                                    onDragOver={(e) => {
                                        cancelDOMEvent(e);
                                        if (!isDragoverState) {
                                            this.setDndState(true);
                                        }
                                    }}
                                    onDragEnter={(e) => {
                                        cancelDOMEvent(e);
                                        if (!isDragoverState) {
                                            this.setDndState(true);
                                        }
                                    }}
                                    onDragLeave={(e) => {
                                        cancelDOMEvent(e);
                                        if (isDragoverState) {
                                            this.setDndState(false);
                                        }
                                    }}
                                    onDragExit={(e) => {
                                        cancelDOMEvent(e);
                                        if (isDragoverState) {
                                            this.setDndState(false);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        cancelDOMEvent(e);
                                        if (isDragoverState) {
                                            this.setDndState(false);
                                        }
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
            </div>
        );
    }

    onUploadChanged(files) {
        const {dispatch, onUploadHide} = this.props;
        dispatch(uploadFiles(files));
        onUploadHide();
    }

    setDndState(state) {
        this.setState({isDragoverState: state});
    }

    onFilesDrop(files) {
        const {dispatch, onUploadHide} = this.props;
        dispatch(uploadFiles(files));
        onUploadHide();
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }

    static makeFieldIdToValuesHash(sample) {
        return _(sample.sampleMetadata)
            .keyBy((value) => value.metadataId)
            .mapValues((values) => values.value)
            .value();
    }

    renderCurrentValues(sample) {
        const {fields} = this.props;
        const fieldIdToValuesHash = FileUploadSampleRightPane.makeFieldIdToValuesHash(sample);
        const fieldsRenders = fields
            .filter(field => !field.isInvisible)
            .map(field => this.renderReadOnlyField(field, fieldIdToValuesHash));
        return (
            <div className='dl-group-view-mode'>
                {fieldsRenders}
            </div>
        );
    }

    renderFooter(selectedSample) {
        const {auth: {isDemo}, samplesList: {onSaveAction}} = this.props;
        return (
            <div>
                <hr/>
                <div className='btn-toolbar btn-toolbar-form-actions'>
                    {this.renderEditButton(selectedSample.type)}
                    {onSaveAction && this.renderSelectButton(isDemo, selectedSample)}
                </div>
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
        let fieldValue = fieldIdToValuesHash[field.id];
        // If field has available values, then the value is id of the actual option.
        // We then need to retrieve the actual value corresponding to the option.
        if (!_.isEmpty(field.availableValues)) {
            const option = _.find(field.availableValues,
                availableValue => availableValue.id === fieldValue);
            fieldValue = option && option.value || '';
        }
        return (
            <dl key={field.id}>
                <dt>{field.label}</dt>
                <dd>{fieldValue}</dd>
            </dl>
        );
    }

    renderSampleContent(selectedSample) {
        const {edited} = this.props;
        return (
            <div className='dl-group-edit-mode'>
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

    onSelectForAnalysisClick(e, sampleId) {
        e.preventDefault();
        const {dispatch, closeModal} = this.props;
        dispatch(sampleSaveCurrent(sampleId));
        closeModal(modalName.UPLOAD); // TODO: closeModal must have no params (it's obvious that we close upload)
    }

    onSampleItemDelete(id) {
        const {dispatch} = this.props;
        dispatch(samplesListServerRemoveSample(id));
    }
}