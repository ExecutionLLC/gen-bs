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

function fileUploadStatusErrorOrReady(status) {
    return _.includes([fileUploadStatus.ERROR, fileUploadStatus.READY], status);
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
        return (
            <div className='split-scroll'>
                <ul id='samplesTabs'
                    className='nav nav-componentes nav-upload-items nav-with-right-menu'>
                    {this.renderNewListItem(currentSampleId === null && currentUploadId === null)}
                    {this.renderUploadedData(true)}
                    {this.renderCurrentUploadData()}
                    {this.renderUploadedData(false)}
                </ul>
            </div>
        );
    }

    renderCurrentUploadData() {
        const {fileUpload: {filesProcesses}, sampleList} = this.props;
        const currentUploads = _.filter(filesProcesses, upload => {
            return upload.progressStatus !== fileUploadStatus.READY;
        });
        const currentUploadsData = _.map(currentUploads, upload => {
            const uploadSamples = _.filter(sampleList.hashedArray.array, sample => sample.vcfFileId === upload.operationId);
            return {
                upload,
                samples: uploadSamples,
                isError: upload.progressStatus === fileUploadStatus.ERROR
            };
        });
        return (
            currentUploadsData.map((data) =>
                data.isError ?
                    this._renderUploadedData({
                        label: data.upload.file.name,
                        upload: data.upload,
                        date: data.upload.created
                    }) :
                    this.renderProgressUploadSample(data)
            )
        );
    }

    renderUploadedData(showNew) {
        const {search, samplesSearchHash, sampleList, fileUpload: {filesProcesses}} = this.props;
        const uploadHash = _.keyBy(filesProcesses, 'operationId');
        const uploadedSamples = _.filter(sampleList.hashedArray.array, sample => !_.isEmpty(sample.sampleFields) && sample.type !== entityType.HISTORY);
        const samplesData = _.map(uploadedSamples, sample => {
            const {vcfFileId} = sample;
            const sampleName = sample.name;
            const currentUpload = uploadHash[vcfFileId];
            return {
                label: sampleName,
                upload: currentUpload,
                sample: sample,
                date: currentUpload ? currentUpload.created : sample.created
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
        const sortedFilteredUploads = _.sortBy(filteredUploadedSamples, ['date']).reverse();
        return (
            sortedFilteredUploads.map((item) => this._renderUploadedData(item, showNew))
        );
    }

    _createSampleLabel(sample) {
        const {type} = sample;
        const sampleName = sample.name;
        return getItemLabelByNameAndType(sampleName, type);
    }


    _renderUploadedData(uploadData, showNew) {
        const {currentHistorySamplesIds, currentSampleId, fileUpload: {currentUploadId}, sampleList: {hashedArray: {hash: samplesHash}}} = this.props;
        const {label, upload, sample} = uploadData;
        if (sample) {
            if (upload) {
                if ((sample.type !== entityType.HISTORY || _.includes(currentHistorySamplesIds, sample.id)) && fileUploadStatusErrorOrReady(upload.progressStatus)) {
                    if (!showNew) {
                        return null;
                    }
                    return this.renderListItem(
                        sample.id,
                        sample.id === currentSampleId,
                        true,
                        (id) => this.onSampleItemClick(id),
                        (id) => this.onSampleItemSelectForAnalysis(id),
                        (id) => this.onSampleItemDelete(id),
                        label,
                        sample.description,
                        sample.created
                    );
                }
                return null;
            } else {
                if (showNew) {
                    return null;
                }
                if (samplesHash[sample.id].type === entityType.USER) {
                    return this.renderListItem(
                        sample.id,
                        sample.id === currentSampleId,
                        null,
                        (id) => this.onSampleItemClick(id),
                        (id) => this.onSampleItemSelectForAnalysis(id),
                        (id) => this.onSampleItemDelete(id),
                        label,
                        sample.description,
                        sample.created
                    );
                } else {
                    return this.renderListItem(
                        sample.id,
                        sample.id === currentSampleId,
                        null,
                        (id) => this.onSampleItemClick(id),
                        (id) => this.onSampleItemSelectForAnalysis(id),
                        null,
                        label,
                        sample.description,
                        sample.created
                    );
                }
            }
        } else {
            if (showNew) {
                return null;
            }
            if (typeof upload.id === 'string') {
                return this.renderListItem(
                    upload.id,
                    upload.id === currentUploadId,
                    false,
                    (id) => this.onUploadErrorItemClick(id),
                    null,
                    (id) => this.onUploadErrorDelete(id),
                    label,
                    upload.error.message,
                    null
                );
            } else {
                if (upload.operationId) {
                    return this.renderListItem(
                        upload.operationId,
                        upload.operationId === currentUploadId,
                        false,
                        (id) => this.onNotUploadedErrorItemClick(id),
                        null,
                        (id) => this.onUploadErrorDelete(id),
                        label,
                        upload.error.message,
                        null
                    );
                } else {
                    return this.renderListItem(
                        upload.id,
                        upload.id === currentUploadId,
                        false,
                        (id) => this.onNotUploadedErrorItemClick(id),
                        null,
                        (id) => this.onNotUploadedErrorItemDelete(id),
                        label,
                        upload.error.message,
                        null
                    );
                }
            }
        }
    }

    renderListItem(id, isActive, isSuccessOrNull, onClick, onSelectForAnalysis, onDelete, label, description, uploadedTimeOrNull) {
        return (
            <li key={id}
                className={classNames({
                    'active': isActive
                })}>
                <a type='button'
                   onClick={() => onClick(id)}>
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
                       Uploaded: {formatDate(uploadedTimeOrNull)}
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
        const {sampleList:{onSaveAction}} = this.props;
        const isRenderDropDown = (onSaveAction && onSelectForAnalysis) || onDelete;
        const className = classNames({'dropdown': true, 'right-menu': true, 'open': isOpen});
        return (
            <div className={className}>
                {isRenderDropDown && <button
                    className='btn btn-link-light-default dropdown-toggle popup-show-button'
                    type='button'
                    onClick={() => this.onShowPopup(id)}
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
                        > Select for analysis</a>
                    </li>}
                    {onDelete && <li>
                        <a
                            href='#'
                            onClick={() => onDelete(id)}
                        >Delete</a>
                    </li>}
                </ul>
            </div>
        );
    }

    renderIcon(isSuccessOrNull) {
        if (isSuccessOrNull) {
            return (
                <i className='icon-state md-i text-success'>check_circle</i>
            );
        }
        return (
            <i className='icon-state md-i text-danger'>error_outline</i>
        );
    }

    static renderProgressBar(uploadItem) {
        const {progressStatus, progressValue} = uploadItem;
        const STAGES = {
            'ajax': {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-default': true
                }),
                renderMessage: 'Loading..'
            },
            'task_running': {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }),
                renderMessage: <span className='text-primary'>Saving...</span>
            },
            'in_progress': {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }),
                renderMessage: <span className='text-primary'>Saving...</span>
            }
        };
        const currentStage = STAGES[progressStatus] || STAGES['ajax'];
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
            progressStatus === 'ajax' ? 'text-normal' : 'text-primary')}>refresh</i>;
    }

    renderProgressUploadSample(uploadData) {
        const {upload, samples} = uploadData;
        if (!samples.length) {
            return this.renderProgressUpload(upload, null);
        } else {
            return (
                samples.map((sample) => this.renderProgressUpload(upload, sample))
            );
        }
    }

    renderProgressUpload(upload, sample) {
        const {currentSampleId, fileUpload: {currentUploadId}} = this.props;
        const key = sample ? sample.id : (upload.operationId || upload.id);
        const isActive = sample ? sample.id === currentSampleId : upload.id === currentUploadId;
        const name = sample ? this._createSampleLabel(sample) : upload.file.name;
        return (
            <li key={key}
                className={classNames({
                    'active': isActive
                })}>
                <a
                    type='button'
                    onClick={() => this.onProgressUploadClick(upload, sample)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    {FileUploadSampleList.renderRefreshIcon(upload)}
                    <span className='link-label'>
                        {name}
                    </span>
                    {FileUploadSampleList.renderProgressBar(upload)}
                </a>
                <div className='right-menu'>
                    <button
                        className='btn btn-link-light-default'
                        type='button'
                        onClick={() => this.onProgressUploadDelete(upload, sample)}
                    >
                        <i className='md-i'>highlight_off</i>
                    </button>
                </div>
            </li>
        );
    }

    renderNewListItem(isActive) {
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
                        New sample
                    </span>
                    <span className='link-desc'>
                        Upload vcf file
                    </span>
                </a>
            </li>
        );
    }

    onProgressUploadClick(upload, sample) {
        if (sample) {
            this.onSampleItemClick(sample.id);
        } else {
            this.onUploadItemClick(upload.id);
        }
    }

    onProgressUploadDelete(upload, sample) {
        if (sample) {
            this.onSampleItemDelete(sample.id);
        } else {
            if (upload.operationId) {
                this.onUploadItemDelete(upload.operationId);
            } else {
                this.onUploadAbort(upload.id);
            }
        }
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
        closeModal('upload');
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

    onShowPopup(id) {
        this.setState({
            showPopup: id
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