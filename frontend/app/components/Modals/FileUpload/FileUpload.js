import React, {Component} from 'react';

import FileUploadProgressBar from './FileUploadProgressBar';

import {clearUploadState, addFilesForUpload} from '../../../actions/fileUpload';


export default class FileUpload extends Component {

    componentWillMount() {
        this.props.dispatch(clearUploadState());
    }

    render() {
        const {auth: {isDemo}, fileUpload: {filesProcesses}} = this.props;
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
                {error && this.renderUploadError(error)}
                {this.renderFileInfo(file)}
                {isArchiving &&
                <div className='text-center'>
                    <strong style={{color: '#2363a1'}}>Archiving...</strong>
                    <i className='fa fa-spinner fa-spin'/>
                </div>
                }
                {!error &&
                <FileUploadProgressBar
                    progressStatus={progressStatus}
                    progressValue={progressValue}
                />
                }
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
                    className='btn-link-default btn-select-file'>
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

    renderUploadError(error) {
        return (
            <div className='alert'>
                <p>{error.message}</p>
                <small>Error code: {error.code}</small>
            </div>
        );
    }

    renderDemoContent() {
        return (
            <div className='panel panel-empty-state'>
                <div className='empty'>
                    <h3><i className='md-i'>perm_identity</i>Please login or register to upload new samples</h3>
                </div>
            </div>
        );
    }

/* uncomment when drag'n'drop will need
    onDragEnter(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    onDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        const {dispatch} = this.props;
        dispatch(addFilesForUpload(Array.prototype.slice.call(event.dataTransfer.files, 0, 1)));
    }
*/

    onUploadChanged(files) {
        const {dispatch} = this.props;
        dispatch(addFilesForUpload([files[0]]));
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }
}
