import React from 'react';
import classNames from 'classnames';
import {formatDate} from './../../../utils/dateUtil';
import _ from 'lodash';
import {ProgressBar} from 'react-bootstrap';

export default class FileUploadSampleList extends React.Component {
    render() {
        const {sampleList, currentSampleId, fileUpload:{filesProcesses, currentUploadId}} = this.props;
        const notUserSamples = _.filter(sampleList, sample => {
            return sample.type != 'user';
        });
        const samplesUploadHash = _.groupBy(sampleList, 'originalId');
        return (
            <div className='split-scroll'>
                <ul id="samplesTabs"
                    className='nav nav-componentes nav-controls nav-upload-items nav-radios nav-with-right-menu'>
                    {this.renderNewListItem(currentSampleId === null && currentUploadId === null)}
                    {filesProcesses.map((filesProcess) => this.renderFileUpload(filesProcess, samplesUploadHash))}
                    {notUserSamples.map((sampleItem) => this.renderListItem(sampleItem.id === currentSampleId, sampleItem))}
                </ul>
            </div>
        );
    }

    renderFileUpload(uploadItem, samplesUploadHash) {
        const {fileUpload:{currentUploadId}} = this.props;
        const {progressStatus, sampleId} = uploadItem;
        if (progressStatus === 'error') {
            return this.renderErrorUpload(uploadItem, uploadItem.id === currentUploadId);
        }
        if (progressStatus == 'ready') {
            const uploadedSamples = samplesUploadHash[sampleId];
            if (uploadedSamples) {
                return this.renderUploadSamples(samplesUploadHash[sampleId]);
            }
            return null;
        }
        return this.renderProgress(uploadItem, uploadItem.id === currentUploadId);

    }

    renderUploadSamples(samples) {
        const {currentSampleId} = this.props;
        return (
            samples.map((sample) => this.renderUploadSample(sample, sample.id === currentSampleId))
        );
    }

    renderUploadSample(sample, isActive) {
        return (
            <li
                key={sample.id}
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onSampleItemClick(sample.id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <i className="icon-state md-i text-success">check_circle</i>
                    <span className='link-label'>
                        {`${sample.fileName}:${sample.genotypeName}`}
                    </span>
                    <span className='link-desc'>
                        Test Description
                    </span>
                    <span className='link-desc'>
                       Uploaded: {formatDate(sample.timestamp)}
                    </span>
                </a>
            </li>
        );
    }

    renderErrorUpload(uploadItem, isActive) {
        const {id, file:{name:fileName}, error} = uploadItem;
        return (
            <li
                key={id}
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onUploadErrorItemClick(id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <i className="icon-state md-i text-danger">error_outline</i>
                    <span className='link-label'>
                        {fileName}
                    </span>
                    <span className='link-desc'>
                        {error.message}
                    </span>
                </a>
            </li>
        );
    }

    renderBar(title, now) {
        return (
            <div>
                <ProgressBar now={now} label='%(percent)s%' bsStyle='success'/>
                <div className='text-center'><strong>{title}</strong></div>
            </div>
        );
    }

    renderProgressBar(uploadItem) {
        const {file:{name}, progressStatus, progressValue} = uploadItem;
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
            <span className="text-primary">Saving..</span>
            </span>
            </div>
        );
    }

    renderProgress(uploadItem, currentUploadId) {
        const {file:{name}} = uploadItem;

        return (
            <li
                key={uploadItem.operationId}
                className={classNames({
                    'active': currentUploadId
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onUploadItemClick(uploadItem.id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <i className='icon-state md-i md-spin text-primary'>refresh</i>
                    <span className='link-label'>
                        {name}
                    </span>
                    {this.renderProgressBar(uploadItem)}
                </a>
            </li>
        );
    }

    renderNewListItem(isActive) {
        return (
            <li
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onSampleNewItem()}
                >
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

    renderListItem(isActive, sampleItem) {
        return (
            <li
                key={sampleItem.id}
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onSampleItemClick(sampleItem.id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios'/>
                        <i />
                    </label>
                    <span className='link-label'>
                        {sampleItem.fileName}
                    </span>
                    <span className='link-desc'>
                        Test Description
                    </span>
                    <span className='small link-desc'>
                            Uploaded: {formatDate(sampleItem.timestamp)}
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