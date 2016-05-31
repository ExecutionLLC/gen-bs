import React, {Component} from 'react';

import FileUploadProgressBar from './FileUploadProgressBar';

import {clearUploadState, addFilesForUpload} from '../../../actions/fileUpload';


export default class FileUpload extends Component {

    componentWillMount() {
        this.props.dispatch(clearUploadState());
    }

    render() {
        const {auth: {isDemo}} = this.props;
        const {error, isArchiving} = this.props.fileUpload;
        if (isDemo) {
            return this.renderDemoContent();
        } else {
            return (
                <div className='panel file-upload-panel panel-default'>
                    <div className='panel-body'>

                        {error && this.renderUploadError(error)}

                        {this.renderUploadButton()}

                        {JSON.stringify(this.props.fileUpload)}
                        {this.props.fileUpload.filesProcesses.map((fp, index) => this.renderMultiFile(fp, index))}

                    </div>
                </div>
            );
        }
    }

    renderMultiFile(fileProcess, index) {
        return (
            <div key={index}>
                {fileProcess.error && this.renderUploadError(fileProcess.error)}
                {this.renderFileInfo(fileProcess.file)}
                {JSON.stringify(fileProcess)}
                {fileProcess.isArchiving &&
                <div className='text-center'>
                    <strong style={{color: '#2363a1'}}>Archiving...</strong>
                    <i className='fa fa-spinner fa-spin'/>
                </div>
                }
                {!fileProcess.error &&
                <FileUploadProgressBar
                    progressStatusFromAS={fileProcess.progressStatusFromAS}
                    progressValueFromAS={fileProcess.progressValueFromAS}
                />
                }
            </div>
        );
    }

    renderFileInfo(file) {
        return (
            <div className="text-center">
                <strong style={{color: '#2363a1'}}>{file.name}</strong>
            </div>
        );
    }

    renderUploadButton() {
        return (
            <button onClick={this.onUploadClick.bind(this)}
                    onDragEnter={(e) => {e.stopPropagation();e.preventDefault();}}
                    onDragOver={(e) => {e.stopPropagation();e.preventDefault();}}
                    onDrop={(e) => {e.stopPropagation();e.preventDefault();this.onFilesDrop(e.dataTransfer.files);}}
                    className='btn-link-light-default btn-select-file'>
                <input
                    onChange={ (e) => this.onUploadChanged(e.target.files)}
                    style={{display: 'none'}}
                    ref='fileInput'
                    id='file-select'
                    type='file'
                    accept='.vcf,.gz'
                    name='files[]'
                    multiple='multiple'
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

    onUploadChanged(files) {
        const {dispatch} = this.props;
        dispatch(addFilesForUpload(Array.prototype.slice.call(files, 0, 1)));
    }

    onFilesDrop(files) {
        const {dispatch} = this.props;
        dispatch(addFilesForUpload(Array.prototype.slice.call(files, 0, 1)))
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }
}
