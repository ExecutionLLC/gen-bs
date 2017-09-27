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
    fileUploadStatus,
    SAMPLE_UPLOAD_STATE
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
import * as i18n from '../../../utils/i18n';


function cancelDOMEvent(e) {
    e.stopPropagation();
    e.preventDefault();
}

// SampleHeader contains current editing name and description in its Inputs states
// and must re-render only if props are changed to prevent clearing the name and description.
class SampleHeader extends React.Component {


    render() {
        const {editingSample, fileUpload: {filesProcesses}} = this.props;
        const isProcessing = _.some(
            filesProcesses,
            (fileProcess) => fileProcess.operationId === editingSample.vcfFileId && fileProcess.progressStatus !== fileUploadStatus.READY
        );
        const uploadedDate = isProcessing ? null : editingSample.created;
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
        const {auth: {isDemo}, editingSample, languageId, p} = this.props;
        const {id, type} = editingSample;
        const description = i18n.getEntityText(editingSample, languageId).description;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={description || ''}
                        placeholder={p.t('samples.editingSample.descriptionPlaceholder')}
                        className='form-control material-input-sm'
                        maxLength={config.UPLOADS.MAX_DESCRIPTION_LENGTH}
                        onChange={(e) => this.onSampleTextChange(id, null, e)}
                        disabled={!entityTypeIsEditable(type) || isDemo}
                    />
                </div>
            </div>
        );
    }

    renderSampleDates(createdDate) {
        const {p} = this.props;
        return (
            <div className='label-group-date'>
                {createdDate ? (
                        <label>{p.t('samples.editingSample.uploaded')}: {formatDate(createdDate)}</label>
                    ) : (
                        <label><span className='text-primary'><i className='md-i'>schedule</i>{p.t('samples.editingSample.wait')}</span></label>
                    )}
            </div>
        );
    }

    renderSampleFileName() {
        const {auth: {isDemo}, editingSample, languageId, p} = this.props;
        const {id, type} = editingSample;
        const name = i18n.getEntityText(editingSample, languageId).name;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={name}
                        className='form-control material-input-sm material-input-heading text-primary'
                        placeholder={p.t('samples.editingSample.namePlaceholder')}
                        maxLength={config.UPLOADS.MAX_NAME_LENGTH}
                        onChange={(e) => this.onSampleTextChange(id, e, null)}
                        disabled={!entityTypeIsEditable(type) || isDemo}
                    />
                </div>
            </div>
        );
    }

    onSampleTextChange(sampleId, sampleName, sampleDescription) {
        const {dispatch, editingSample, languageId} = this.props;
        const {name, description} = i18n.getEntityText(editingSample, languageId);
        const newName = sampleName || name;
        const newDescription = sampleDescription || description;
        dispatch(updateSampleText(sampleId, newName, newDescription, languageId));
        dispatch(requestUpdateSampleTextAsync(sampleId))
            .then((newSample) => {
                dispatch(sampleSaveCurrentIfSelected(sampleId, newSample.id));
                dispatch(setCurrentSampleId(newSample.id));
            });
    }

    renderDeleteSampleButton() {
        const {editingSample, p} = this.props;
        if (entityTypeIsEditable(editingSample.type)) {
            return (
                <button
                    className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                    onClick={() => this.onSampleItemDelete(editingSample.id)}
                >
                    <span>{p.t('samples.editingSample.deleteSample')}</span>
                </button>
            );
        }
    }

    onSampleItemDelete(id) {
        const {dispatch} = this.props;
        dispatch(samplesListServerRemoveSample(id));
    }
}

export default class FileUploadSampleRightPane extends React.Component {

    RENDER_MODE = {
        UPLOAD: {labelPath: 'samples.rightPaneError.description.file'},
        SAMPLE: {labelPath: 'samples.rightPaneError.description.sample'}
    };

    constructor(props) {
        super(props);
        this.state = {isDragoverState: false};
    }

    render() {
        const {samplesList, auth, dispatch, fileUpload, isBringToFront, currentSampleId, languageId, p} = this.props;
        const {isDemo} = auth;
        const {currentUploadId} = fileUpload;
        const {editingSample, hashedArray: {hash: samplesHash}} = samplesList;
        const selectedSample = currentSampleId ? samplesHash[currentSampleId] : null;
        const isSelectedSampleValid = selectedSample && (selectedSample.uploadState === SAMPLE_UPLOAD_STATE.COMPLETED ||
            selectedSample.uploadState === SAMPLE_UPLOAD_STATE.UNCONFIRMED);

        let content = null;
        if (selectedSample) {
            content = this.renderSample(selectedSample);
        } else if (currentUploadId) {
            content = this.renderUpload(currentUploadId);
        } else {
            content = this.renderNewUploadArea(isDemo);
        }

        return (
            <div className={classNames({'split-right': true, 'bring-to-front': isBringToFront})}>
                <div className='split-top'>
                    {editingSample && isSelectedSampleValid &&
                    <SampleHeader editingSample={editingSample}
                                  auth={auth}
                                  fileUpload={fileUpload}
                                  languageId={languageId}
                                  dispatch={dispatch}
                                  p={p}
                    />}
                </div>
                <div className='split-scroll'>
                    <div className='form-horizontal form-padding'>
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    renderSample(sample) {
        switch (sample.uploadState) {
            case SAMPLE_UPLOAD_STATE.COMPLETED:
            case SAMPLE_UPLOAD_STATE.UNCONFIRMED:
                return this.renderSampleContent(sample);
            case SAMPLE_UPLOAD_STATE.NOT_FOUND:
            case SAMPLE_UPLOAD_STATE.ERROR:
            default:
                return this.renderLoadError(this.RENDER_MODE.SAMPLE);
        }
    }

    renderUpload(uploadId) {
        const {fileUpload: {filesProcesses}} = this.props;
        const fileProcess = _.find(filesProcesses, fp => fp.id === uploadId || fp.operationId === uploadId);
        if (fileProcess && fileProcess.error) {
            return this.renderLoadError(this.RENDER_MODE.UPLOAD);
        } else {
            return this.renderLoad();
        }
    }

    renderLoad() {
        const {p} = this.props;
        return (
            <div className='alert alert-help'>
                <p>
                    <strong>{p.t('samples.rightPaneWait.title')}</strong><span>{p.t('samples.rightPaneWait.description')}</span>
                </p>
            </div>
        );
    }

    renderLoadError(renderMode) {
        const {p} = this.props;
        return (
            <div className='alert alert-danger'>
                <p>
                    <strong>{p.t('samples.rightPaneError.title')}</strong><span>{p.t(renderMode.labelPath)}</span>
                </p>
            </div>
        );
    }

    renderNewUploadArea(isDemo) {
        const {p} = this.props;
        const {isDragoverState} = this.state;
        return (
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
                                this.onUploadChanged([...e.target.files]);
                                e.target.value = null;
                            }}
                            style={{display: 'none'}}
                            ref='fileInput'
                            id='file-select'
                            type='file'
                            accept='.vcf,.gz,.txt'
                            name='files[]'
                            defaultValue=''
                            multiple='multiple'
                        />
                        <h3>
                            {p.t('samples.dropAreaText.dropVcfFileHereOr')}
                            <span className='text-underline'>{p.t('samples.dropAreaText.clickHere')}</span>
                            {p.t('samples.dropAreaText.toSelect')}
                        </h3>
                    </button>
                    }
                    {isDemo &&
                    <h3><i className='md-i'>perm_identity</i>{p.t('samples.loginOrRegister')}</h3>}
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

    static makeFieldIdToValuesHash(sample, languageId) {
        return _(sample.sampleMetadata)
            .keyBy((value) => value.metadataId)
            .mapValues((values) => i18n.getEntityText(values, languageId).value)
            .value();
    }

    renderCurrentValues(sample) {
        const {fields, languageId} = this.props;
        const fieldIdToValuesHash = FileUploadSampleRightPane.makeFieldIdToValuesHash(sample, languageId);
        const fieldsRenders = fields
            .filter(field => !field.isInvisible)
            .map(field => this.renderReadOnlyField(field, fieldIdToValuesHash, languageId));
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
        const {p} = this.props;
        if (entityTypeIsDemoDisabled(sample.type, isDemoSession)) {
            return (
                <span>
                    {p.t('samples.editingSample.registerToAnalyze')}
                </span>
            );
        }

        return (
            <a onClick={(e) => this.onSelectForAnalysisClick(e, sample.id)}
               className='btn btn-link btn-uppercase'
               type='button'
            >
                <span>{p.t('samples.editingSample.selectForAnalysis')}</span>
            </a>
        );
    }

    renderEditButton(sampleType) {
        const {p} = this.props;
        if (entityTypeIsEditable(sampleType)) {
            return (
                <a onClick={() => this.onShowValuesClick()}
                   className='btn btn-link btn-uppercase' role='button'
                   href='#'>{p.t('samples.editingSample.edit')}
                </a>
            );
        }

        return null;
    }

    onShowValuesClick() {
        const {changeShowValues, edited} = this.props;
        changeShowValues(!edited);
    }

    renderReadOnlyField(field, fieldIdToValuesHash, languageId) {
        let fieldValue = fieldIdToValuesHash[field.id];
        // If field has available values, then the value is id of the actual option.
        // We then need to retrieve the actual value corresponding to the option.
        if (!_.isEmpty(field.availableValues)) {
            const option = _.find(field.availableValues,
                availableValue => availableValue.id === fieldValue);
            const valueText = option && i18n.getEntityText(option, languageId);
            fieldValue = valueText && valueText.value || '';
        }
        return (
            <dl key={field.id}>
                <dt>{i18n.getEntityText(field, languageId).label}</dt>
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
        const {dispatch, changeShowValues, fields, samplesList: {editingSample, editingSampleDisabled}, languageId, p} = this.props;
        if (!editingSample || editingSample.id !== sampleId) {
            return null;
        }
        const fieldIdToValuesHash = FileUploadSampleRightPane.makeFieldIdToValuesHash(editingSample, languageId);
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       fields={fields}
                                       sampleId={sampleId}
                                       fieldIdToValuesHash={fieldIdToValuesHash}
                                       changeShowValues={changeShowValues}
                                       disabled={editingSampleDisabled}
                                       languageId={languageId}
                                       p={p}
            />
        );
    }

    onSelectForAnalysisClick(e, sampleId) {
        e.preventDefault();
        const {dispatch, closeModal} = this.props;
        dispatch(sampleSaveCurrent(sampleId));
        closeModal();
    }
}