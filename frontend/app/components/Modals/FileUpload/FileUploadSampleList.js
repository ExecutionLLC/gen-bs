import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import {formatDate} from './../../../utils/dateUtil';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {entityType} from '../../../utils/entityTypes';
import {
    fileUploadStatus,
    uploadsListRemoveUpload,
    uploadsListServerRemoveUpload,
    abortRequest
} from '../../../actions/fileUpload';
import {samplesListServerRemoveSample, sampleSaveCurrent} from '../../../actions/samplesList';
import {modalName} from '../../../actions/modalWindows';
import {SAMPLE_UPLOAD_STATE} from '../../../actions/fileUpload';

function fileUploadStatusErrorOrReady(upload) {
    return _.includes([fileUploadStatus.ERROR, fileUploadStatus.READY], upload.progressStatus);
}

export default class FileUploadSampleList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showPopup: null
        };
        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.onDocumentClick, false);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onDocumentClick, false);
    }

    render() {
        const {currentSampleId, fileUpload: {currentUploadId}} = this.props;
        const uploadedData = this.getUploadedData();
        return (
            <div className='split-scroll'>
                <ul id='samplesTabs'
                    className='nav nav-componentes nav-upload-items nav-with-right-menu'>
                    {this.renderNewListItem(currentSampleId === null && currentUploadId === null)}
                    {this.renderUploadedData(uploadedData[0], true)}
                    {this.renderCurrentUploadData()}
                    {this.renderUploadedData(uploadedData[1], false)}
                </ul>
            </div>
        );
    }

    renderCurrentUploadData() {
        const {fileUpload: {filesProcesses}, sampleList} = this.props;
        const {currentSampleId} = this.props;
        const currentUploads = _.filter(filesProcesses, upload => {
            return upload.progressStatus !== fileUploadStatus.READY;
        });
        return _.map(currentUploads, upload => {
            const uploadSamples = _.filter(sampleList.hashedArray.array, {vcfFileId: upload.operationId});
            const isError = upload.progressStatus === fileUploadStatus.ERROR;

            if (uploadSamples.length) {
                if (isError) {
                    return _.map(uploadSamples, (sample) => this._renderSampleError(sample, sample.name, sample.id === currentSampleId));
                } else {
                    return this.renderProgressUploadSamples(uploadSamples, upload);
                }
            } else {
                if (isError) {
                    return this._renderUploadedDataFileError(upload, upload.file.name);
                } else {
                    return this.renderProgressUploadFile(upload);
                }
            }
        });
    }

    getUploadedData() {
        const {search, samplesSearchHash, sampleList, fileUpload: {filesProcesses}} = this.props;
        const uploadHash = _.keyBy(filesProcesses, 'operationId');
        const uploadedSamples = _.filter(sampleList.hashedArray.array, sample => !_.isEmpty(sample.sampleFields) && sample.type !== entityType.HISTORY);
        const samplesData = _.map(uploadedSamples, sample => {
            const {vcfFileId, name: sampleName, created: sampleCreated} = sample;
            const currentUpload = uploadHash[vcfFileId];
            return {
                label: sampleName,
                upload: currentUpload,
                sample: sample,
                date: currentUpload ? currentUpload.created : sampleCreated
            };
        });
        const filteredUploadedSamples = _.filter(samplesData, finishedUpload => {
            const {label, sample} = finishedUpload;
            const sampleSearch = search.toLowerCase();
            if (!sampleSearch) {
                return true;
            }
            if (sample) {
                const searchValues = samplesSearchHash[sample.id].searchValues;
                return _.some(searchValues, searchValue => searchValue.indexOf(sampleSearch) >= 0) || label.toLocaleLowerCase().indexOf(sampleSearch) >= 0;
            } else {
                return label.toLocaleLowerCase().indexOf(sampleSearch) >= 0;
            }
        });
        const sortedFilteredUploads = _.orderBy(filteredUploadedSamples, ['date'], ['desc']);

        return _.partition(sortedFilteredUploads, (item) => {
            return !_.isNil(item.upload) && fileUploadStatusErrorOrReady(item.upload);
        });
    }

    _createSampleLabel(sample) {
        const {type} = sample;
        const sampleName = sample.name;
        return getItemLabelByNameAndType(sampleName, type);
    }

    _renderSample(sample, label, isActive, isNew) {
        const isDeletable = sample.type === entityType.USER;
        return this.renderListItem(
            sample.id,
            isActive,
            isNew ? true : null,
            (id) => this.onSampleItemClick(id),
            (id) => this.onSampleItemSelectForAnalysis(id),
            isDeletable ? (id) => this.onSampleItemDelete(id) : null,
            label,
            sample.description,
            sample.created
        );
    }

    renderUploadedData(uploadedItems, isNew) {
        const {currentSampleId} = this.props;
        return _.map(uploadedItems, (item) => {
            if (item.sample.uploadState === SAMPLE_UPLOAD_STATE.COMPLETED) {
                return this._renderSample(item.sample, item.label, item.sample.id === currentSampleId, isNew);
            } else {
                return this._renderSampleError(item.sample, item.label, item.sample.id === currentSampleId);
            }
        });
    }

    _renderSampleError(sample, label, isActive) {
        const {p} = this.props;
        const message = sample.error || (sample.uploadState === SAMPLE_UPLOAD_STATE.NOT_FOUND
                ? p.t('samples.error.sampleNotFound')
                : p.t('samples.error.unknown'));
        return this.renderListItem(
            sample.id,
            isActive,
            false,
            (id) => this.onSampleItemClick(id),
            null,
            (id) => this.onSampleItemDelete(id),
            label,
            message,
            null
        );
    }

    _renderUploadedDataFileError(upload, label) {
        const {fileUpload: {currentUploadId}} = this.props;
        const {id, operationId, error: {message}} = upload;
        const isUploaded = typeof upload.id === 'string';
        const isOperationId = !isUploaded && operationId;
        const key = isOperationId ? operationId : id;
        const isActive = key === currentUploadId;
        const clickAsUploaded = isUploaded;
        const deleteAsUploaded = isUploaded || isOperationId;

        return this.renderListItem(
            key,
            isActive,
            false,
            () => clickAsUploaded ? this.onUploadErrorItemClick(key) : this.onNotUploadedErrorItemClick(key),
            null,
            () => deleteAsUploaded ? this.onUploadErrorDelete(key) : this.onNotUploadedErrorItemDelete(key),
            label,
            message,
            null
        );
    }

    renderListItem(id, isActive, isSuccessOrNull, onClick, onSelectForAnalysis, onDelete, label, description, uploadedTimeOrNull) {
        const {p} = this.props;
        return (
            <li key={id}
                className={classNames({
                    'active': isActive
                })}>
                <a
                    type='button'
                    onClick={() => onClick(id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    {!_.isNull(isSuccessOrNull) && this.renderIcon(isSuccessOrNull)}
                    <span className='link-label'>
                        {label}
                    </span>
                    <span className='link-desc'>
                        {description}
                    </span>
                    {uploadedTimeOrNull && <span className='small link-desc'>
                        {p.t('samples.uploaded')}: {formatDate(uploadedTimeOrNull)}
                    </span>}
                </a>
                {onDelete && !onSelectForAnalysis ?
                    <div className='right-menu'>
                        <button
                            className='btn btn-link-light-default'
                            type='button'
                            onClick={() => onDelete(id)}
                        >
                            <i className='md-i'>highlight_off</i>
                        </button>
                    </div> :
                    this.renderDropdown(id, onSelectForAnalysis, onDelete)
                }
            </li>
        );
    }

    renderDropdown(id, onSelectForAnalysis, onDelete) {
        const isOpen = this.state.showPopup === id;
        const {sampleList:{onSaveAction}, p} = this.props;
        const isRenderDropDown = (onSaveAction && onSelectForAnalysis) || onDelete;
        const className = classNames({'dropdown': true, 'right-menu': true, 'open': isOpen});
        return (
            <div className={className}>
                {isRenderDropDown && <button
                    className='btn btn-link-light-default dropdown-toggle popup-show-button'
                    type='button'
                    onClick={() => this.onTogglePopup(id)}
                >
                    <i className='md-i'>more_horiz</i>
                    <span className='caret'></span>
                </button>}
                <ul className='dropdown-menu dropdown-menu-right'>
                    {onSelectForAnalysis && onSaveAction && <li>
                        <a
                            href='#'
                            className='selectForAnalysisBtn'
                            onClick={() => onSelectForAnalysis(id)}
                        >{p.t('samples.selectForAnalysis')}</a>
                    </li>}
                    {onDelete && <li>
                        <a
                            href='#'
                            onClick={() => onDelete(id)}
                        >{p.t('samples.deleteSample')}</a>
                    </li>}
                </ul>
            </div>
        );
    }

    renderIcon(isSuccess) {
        if (isSuccess) {
            return <i className='icon-state md-i text-success'>check_circle</i>;
        } else {
            return <i className='icon-state md-i text-danger'>error_outline</i>;
        }
    }

    renderProgressBar(uploadItem) {
        const {p} = this.props;
        const {progressStatus, progressValue} = uploadItem;
        const STAGES = {
            [fileUploadStatus.AJAX]: {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-default': true
                }),
                renderMessage: p.t('samples.loading')
            },
            [fileUploadStatus.TASK_RUNNING]: {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }),
                renderMessage: <span className='text-primary'>{p.t('samples.saving')}</span>
            },
            [fileUploadStatus.IN_PROGRESS]: {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }),
                renderMessage: <span className='text-primary'>{p.t('samples.saving')}</span>
            }
        };
        const currentStage = STAGES[progressStatus] || STAGES[fileUploadStatus.AJAX];
        if (!currentStage) {
            return null;
        }
        return (
            <div>
                <div className='progress'>
                    <div
                        className={currentStage.classNames}
                        role='progressbar'
                        style={{width: `${progressValue}%`}}
                    >
                    </div>
                </div>
                <span className='link-desc'>
                    {currentStage.renderMessage}
                </span>
            </div>
        );
    }

    static renderRefreshIcon(uploadItem) {
        const {progressStatus} = uploadItem;
        return <i className={classNames('icon-state md-i md-spin',
            progressStatus === fileUploadStatus.AJAX ? 'text-normal' : 'text-primary')}>refresh</i>;
    }

    renderProgressUploadListItem(key, name, upload, isActive, onClick, onDelete) {
        return (
            <li key={key}
                className={classNames({
                    'active': isActive
                })}>
                <a
                    type='button'
                    onClick={onClick}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    {FileUploadSampleList.renderRefreshIcon(upload)}
                    <span className='link-label'>
                        {name}
                    </span>
                    {this.renderProgressBar(upload)}
                </a>
                <div className='right-menu'>
                    <button
                        className='btn btn-link-light-default'
                        type='button'
                        onClick={onDelete}
                    >
                        <i className='md-i'>highlight_off</i>
                    </button>
                </div>
            </li>
        );
    }

    renderProgressUploadFile(upload) {
        if (upload.operationId) {
            return this.renderProgressUploadSampleOperation(upload);
        } else {
            return this.renderProgressUploadSampleAjax(upload);
        }
    }

    renderProgressUploadSamples(samples, upload) {
        return samples.map(
            (sample) => this.renderProgressUploadSampleSample(upload, sample)
        );
    }

    renderProgressUploadSampleAjax(upload) {
        const {fileUpload: {currentUploadId}} = this.props;
        const key = upload.id;
        const isActive = upload.id === currentUploadId;
        const name = upload.file.name;

        return this.renderProgressUploadListItem(
            key,
            name,
            upload,
            isActive,
            () => this.onUploadItemClick(upload.id),
            () => this.onUploadAbort(upload.id)
        );
    }

    renderProgressUploadSampleOperation(upload) {
        const {fileUpload: {currentUploadId}} = this.props;
        const key = upload.operationId;
        const isActive = upload.id === currentUploadId;
        const name = upload.file.name;

        return this.renderProgressUploadListItem(
            key,
            name,
            upload,
            isActive,
            () => this.onUploadItemClick(upload.id),
            () => this.onUploadItemDelete(upload.operationId)
        );
    }

    renderProgressUploadSampleSample(upload, sample) {
        const {currentSampleId} = this.props;
        const key = sample.id;
        const isActive = sample.id === currentSampleId;
        const name = this._createSampleLabel(sample);
        return this.renderProgressUploadListItem(
            key,
            name,
            upload,
            isActive,
            () => this.onSampleItemClick(sample.id),
            () => this.onSampleItemDelete(sample.id)
        );
    }

    renderNewListItem(isActive) {
        const {p} = this.props;
        return (
            <li className={classNames({
                'active': isActive
            })}>
                <a type='button'
                   onClick={() => this.onSampleNewItem()}>
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <span className='link-label'>
                        {p.t('samples.newSample')}
                    </span>
                    <span className='link-desc'>
                        {p.t('samples.newSampleDescription')}
                    </span>
                </a>
            </li>
        );
    }

    onNotUploadedErrorItemClick(id) {
        const {onSelectUpload} = this.props;
        onSelectUpload(id);
    }

    onNotUploadedErrorItemDelete(id) {
        const {dispatch} = this.props;
        dispatch(uploadsListRemoveUpload(id));
    }

    onUploadErrorItemClick(id) {
        const {onSelectUpload} = this.props;
        onSelectUpload(id);
    }

    onUploadErrorDelete(id) {
        const {dispatch} = this.props;
        dispatch(uploadsListServerRemoveUpload(id));
    }

    onUploadItemClick(id) {
        const {onSelectUpload} = this.props;
        onSelectUpload(id);
    }

    onSampleItemClick(id) {
        const {onSelectSample} = this.props;
        onSelectSample(id);
    }

    onSampleNewItem() {
        const {onSelectSample} = this.props;
        onSelectSample(null);
    }

    onSampleItemSelectForAnalysis(id) {
        const {dispatch, closeModal} = this.props;
        dispatch(sampleSaveCurrent(id));
        closeModal(modalName.UPLOAD); // TODO: closeModal must have no params (it's obvious that we close upload)
    }

    onSampleItemDelete(id) {
        const {dispatch} = this.props;
        dispatch(samplesListServerRemoveSample(id));
    }

    onUploadItemDelete(id) {
        const {dispatch} = this.props;
        dispatch(uploadsListServerRemoveUpload(id));
    }

    onUploadAbort(id) {
        const {dispatch} = this.props;
        dispatch(abortRequest(id));
    }

    onTogglePopup(id) {
        this.setState({
            showPopup: this.state.showPopup === id ? null : id
        });
    }

    onDocumentClick(e) {

        function findClosestPopupShowButton(el) {
            let currentEl = el;
            while (currentEl) {
                if (currentEl.classList && currentEl.classList.contains('popup-show-button')) {
                    return true;
                }
                currentEl = currentEl.parentNode;
            }
            return false;
        }

        if (!findClosestPopupShowButton(e.target)) {
            this.setState({
                showPopup: null
            });
        }
        return false;
    }
}

FileUploadSampleList.propTypes = {
    onSelectSample: React.PropTypes.func.isRequired,
    onSelectUpload: React.PropTypes.func.isRequired,
    closeModal: React.PropTypes.func.isRequired
};