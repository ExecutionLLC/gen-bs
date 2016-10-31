import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import {formatDate} from './../../../utils/dateUtil';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';

export default class FileUploadSampleList extends React.Component {
    render() {
        const {currentSampleId, fileUpload:{currentUploadId}} = this.props;
        return (
            <div className='split-scroll'>
                <ul id='samplesTabs'
                    className='nav nav-componentes nav-controls nav-upload-items nav-radios nav-with-right-menu'>
                    {this.renderNewListItem(currentSampleId === null && currentUploadId === null)}
                    {this.renderCurrentUploadData()}
                    {this.renderUploadedData()}
                </ul>
            </div>
        );
    }

    renderCurrentUploadData(){
        const {fileUpload:{filesProcesses, currentUploadId}} = this.props;
        const currentUploads = _.filter(filesProcesses, upload => {
            return !_.includes(['error', 'ready'], upload.progressStatus);
        });
        return (
            currentUploads.map((upload) => this.renderProgressUpload(upload, upload.id === currentUploadId))
        );
    }

    renderUploadedData(){
        const {search, samplesSearchHash, sampleList, fileUpload:{filesProcesses}} = this.props;
        const uploadHash = _.keyBy(filesProcesses,'sampleId');
        const errorUploads = _.filter(filesProcesses,upload => upload.progressStatus === 'error');
        const errorsData = _.map(errorUploads, errorUpload => {
            return {
                label: errorUpload.file.name,
                upload: errorUpload
            };
        });
        const samplesData =_.map(sampleList.hashedArray.array,sample => {
            const {genotypeName,fileName, type, originalId} = sample;
            const sampleName = genotypeName ? `${fileName}:${genotypeName}` : fileName;
            return {
                label: getItemLabelByNameAndType(sampleName, type),
                upload: uploadHash[originalId],
                sample: sample
            };
        });
        const finishedUploads = _.union(errorsData,samplesData);
        const filteredUploadedSamples = _.filter(finishedUploads, finishedUpload => {
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
        const sortedFilteredUploads = _.sortBy(filteredUploadedSamples,['label']);
        return (
            sortedFilteredUploads.map((item) => this._renderUploadedData(item))
        );
    }


    _renderUploadedData(uploadData) {
        const {currentHistorySamplesIds, currentSampleId, fileUpload:{currentUploadId}} = this.props;
        const {label, upload, sample} = uploadData;
        if (sample){
            if (upload){
                if (sample.type !=='history' || _.includes(currentHistorySamplesIds,sample.id)){
                    return this.renderListItem(
                        sample.id,
                        sample.id === currentSampleId,
                        true,
                        (id) => this.onSampleItemClick(id),
                        label,
                        'Test description',
                        sample.timestamp
                    );
                }
                return null;
            }
            return this.renderListItem(
                sample.id,
                sample.id === currentSampleId,
                null,
                (id) => this.onSampleItemClick(id),
                label,
                'Test description',
                sample.timestamp
            );
        }
        return this.renderListItem(
            upload.id,
            upload.id === currentUploadId,
            false,
            (id) => this.onUploadErrorItemClick(id),
            label,
            upload.error.message,
            null
        );
    }

    renderListItem(id, isActive, isSuccessOrNull, onClick, label, description, uploadedTimeOrNull) {
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
                    {uploadedTimeOrNull && <span className='link-desc'>
                       Uploaded: {formatDate(uploadedTimeOrNull)}
                    </span>}
                </a>
            </li>
        );
    }

    renderIcon(isSuccessOrNull){
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
                }), message: 'Loading..'
            },
            'task_running': {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }), message: 'Saving..'
            },
            'in_progress': {
                classNames: classNames({
                    'progress-bar': true, 'progress-bar-primary': true
                }), message: 'Saving..'
            }
        };
        const currentStage = STAGES[progressStatus] || STAGES['ajax'];
        if (!currentStage) {
            return null;
        }
        return (
            <div>
                <div className='progress'>
                    <div className={currentStage.classNames}
                         role='progressbar'
                         style={{width: `${progressValue}%`}}>
                    </div>
                </div>
                <span className='link-desc'>
            <span className='text-primary'>Saving..</span>
            </span>
            </div>
        );
    }

    renderProgressUpload(uploadItem, currentUploadId) {
        const {file:{name}} = uploadItem;

        return (
            <li key={uploadItem.operationId}
                className={classNames({
                    'active': currentUploadId
                })}>
                <a type='button'
                   onClick={() => this.onUploadItemClick(uploadItem.id)}>
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <i className='icon-state md-i md-spin text-primary'>refresh</i>
                    <span className='link-label'>
                        {name}
                    </span>
                    {FileUploadSampleList.renderProgressBar(uploadItem)}
                </a>
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

    onUploadErrorItemClick(id) {
        const {onSelectUpload} = this.props;
        onSelectUpload(id);
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
}

FileUploadSampleList.propTypes = {
    onSelectSample: React.PropTypes.func.isRequired,
    onSelectUpload: React.PropTypes.func.isRequired
};